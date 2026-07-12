import {
  Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy,
  ChangeDetectorRef, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { MeetingStateService, MeetingState } from '../../services/meeting-state.service';
import { MeetingSessionService } from '../../services/meeting-session.service';
import { ChimeService } from '../../services/chime.service';
import { DeviceService } from '../../services/device.service';
import { ChatService } from '../../services/chat.service';
import { Participant } from '../../models/participant.models';

import { VideoTileComponent } from '../video-tile/video-tile.component';
import { ParticipantGridComponent } from '../participant-grid/participant-grid.component';
import { MeetingControlsComponent } from '../meeting-controls/meeting-controls.component';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { ParticipantListComponent } from '../participant-list/participant-list.component';
import { NccIconComponent } from '../icon/ncc-icon.component';

@Component({
  selector: 'ncc-floating-meeting',
  standalone: true,
  imports: [
    CommonModule,
    VideoTileComponent,
    ParticipantGridComponent,
    MeetingControlsComponent,
    ChatPanelComponent,
    ParticipantListComponent,
    NccIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Minimized card ────────────────────────────────────── -->
    <div *ngIf="!isExpanded"
      class="ncc-float-card"
      [style.left.px]="posX"
      [style.top.px]="posY"
      [style.width.px]="cardWidth"
      [style.height.px]="cardHeight">

      <!-- Drag handle header -->
      <div class="ncc-float-card__header"
        (pointerdown)="onHeaderPointerDown($event)">
        <div class="ncc-float-brand">
          <span class="ncc-float-status-dot" [class.ncc-float-status-dot--live]="isConnected"></span>
          <span class="ncc-float-brand-name">{{ brandName }}</span>
          <span class="ncc-float-pcount" *ngIf="participantCount > 0">{{ participantCount }}</span>
        </div>
        <button class="ncc-float-icon-btn" (click)="expand($event)" title="Expand to full view">
          <ncc-icon name="expand" [size]="16"></ncc-icon>
        </button>
      </div>

      <!-- Live video of active speaker -->
      <div class="ncc-float-card__video">
        <ncc-video-tile
          *ngIf="activeSpeaker"
          [participant]="activeSpeaker">
        </ncc-video-tile>
        <div class="ncc-float-card__placeholder" *ngIf="!activeSpeaker">
          <div class="ncc-float-waiting">
            <div class="ncc-spinner-sm"></div>
            <span>Waiting…</span>
          </div>
        </div>
      </div>

      <!-- Compact controls -->
      <div class="ncc-float-card__controls">
        <span class="ncc-float-others-badge" *ngIf="participantCount > 1">
          +{{ participantCount - 1 }}
        </span>

        <button class="ncc-float-ctrl"
          [class.ncc-float-ctrl--off]="state.isLocalMuted"
          (click)="toggleMute($event)"
          [title]="state.isLocalMuted ? 'Unmute' : 'Mute'">
          <ncc-icon [name]="state.isLocalMuted ? 'mic-off' : 'mic'" [size]="17"></ncc-icon>
        </button>

        <button class="ncc-float-ctrl"
          [class.ncc-float-ctrl--off]="!state.isLocalVideoOn"
          (click)="toggleVideo($event)"
          [title]="state.isLocalVideoOn ? 'Stop video' : 'Start video'">
          <ncc-icon [name]="state.isLocalVideoOn ? 'video' : 'video-off'" [size]="17"></ncc-icon>
        </button>

        <!-- Camera flip -->
        <button class="ncc-float-ctrl"
          *ngIf="meetingState.hasCameraSwitch"
          (click)="switchCamera($event)"
          title="Switch camera">
          <ncc-icon name="camera-flip" [size]="17"></ncc-icon>
        </button>

        <button class="ncc-float-ctrl ncc-float-ctrl--end"
          (click)="endMeeting($event)"
          title="End call">
          <ncc-icon name="phone-end" [size]="17"></ncc-icon>
        </button>
      </div>

      <!-- Resize handles -->
      <div class="ncc-float-resize ncc-float-resize--e"
           (pointerdown)="onResizePointerDown($event, 'e')"
           title="Resize width"></div>
      <div class="ncc-float-resize ncc-float-resize--s"
           (pointerdown)="onResizePointerDown($event, 's')"
           title="Resize height"></div>
      <div class="ncc-float-resize ncc-float-resize--se"
           (pointerdown)="onResizePointerDown($event, 'se')"
           title="Resize"></div>
    </div>

    <!-- ── Expanded overlay ──────────────────────────────────── -->
    <div *ngIf="isExpanded" class="ncc-float-overlay">

      <div class="ncc-float-overlay__header">
        <div class="ncc-float-brand">
          <span class="ncc-float-status-dot ncc-float-status-dot--live"></span>
          <span class="ncc-float-brand-name">{{ brandName }}</span>
          <span class="ncc-float-pcount" *ngIf="participantCount > 0">
            {{ participantCount }} participant{{ participantCount !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="ncc-float-overlay__actions">
          <button class="ncc-float-icon-btn" (click)="minimize()" title="Minimize">
            <ncc-icon name="minimize" [size]="16"></ncc-icon>
          </button>
        </div>
      </div>

      <div class="ncc-float-overlay__body">
        <div class="ncc-float-overlay__stage">
          <div class="ncc-float-overlay__connecting"
            *ngIf="state.status === 'connecting' || state.status === 'reconnecting'">
            <div class="ncc-spinner"></div>
            <p>{{ state.status === 'reconnecting' ? 'Reconnecting...' : 'Connecting...' }}</p>
          </div>
          <ncc-participant-grid
            *ngIf="state.status === 'connected'"
            [participants]="state.participants"
            [layout]="state.layout"
            [activeSpeakerId]="state.activeSpeakerId">
          </ncc-participant-grid>
        </div>

        <ncc-participant-list
          *ngIf="participantsOpen"
          [participants]="state.participants"
          (close)="closeParticipants()"
          class="ncc-float-overlay__sidebar">
        </ncc-participant-list>

        <ncc-chat-panel
          *ngIf="chatOpen"
          class="ncc-float-overlay__sidebar">
        </ncc-chat-panel>
      </div>

      <ncc-meeting-controls
        [isMuted]="state.isLocalMuted"
        [isVideoOn]="state.isLocalVideoOn"
        [isSharingScreen]="state.isSharingScreen"
        [isChatOpen]="chatOpen"
        [isParticipantsOpen]="participantsOpen"
        [unreadCount]="unreadCount"
        [participantCount]="participantCount"
        [layout]="state.layout"
        [showCameraSwitch]="meetingState.hasCameraSwitch"
        (toggleMute)="meetingState.toggleMute()"
        (toggleVideo)="meetingState.toggleVideo()"
        (toggleScreenShare)="meetingState.toggleScreenShare()"
        (toggleChat)="toggleChatPanel()"
        (toggleParticipants)="toggleParticipantsPanel()"
        (leaveMeeting)="endMeeting()"
        (layoutChange)="meetingState.setLayout($event)"
        (switchCamera)="meetingState.switchCameraFacing()">
      </ncc-meeting-controls>

    </div>
  `,
  styles: [`
    /* ── Minimized card ─────────────────────────────────────── */
    .ncc-float-card {
      position: fixed;
      background: var(--ncc-surface, #1c1f2e);
      border: 1px solid var(--ncc-border, #2d3748);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      font-family: var(--ncc-font-family, 'Inter', system-ui, sans-serif);
      user-select: none;
      /* min/max enforced in JS; these are safety fallbacks */
      min-width: 220px;
      min-height: 160px;
    }

    .ncc-float-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--ncc-surface-elevated, #262a3b);
      border-bottom: 1px solid var(--ncc-border, #2d3748);
      cursor: grab;
      flex-shrink: 0;
      height: 40px;
      box-sizing: border-box;
    }
    .ncc-float-card__header:active { cursor: grabbing; }

    .ncc-float-card__video {
      flex: 1;
      min-height: 0;
      position: relative;
      background: var(--ncc-bg, #111216);
      overflow: hidden;
    }

    .ncc-float-card__placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ncc-float-waiting {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--ncc-text-muted, #8892a4);
      font-size: 0.75rem;
    }

    .ncc-float-others-badge {
      font-size: 0.68rem;
      color: var(--ncc-text-muted, #8892a4);
      background: var(--ncc-surface, #1c1f2e);
      border: 1px solid var(--ncc-border, #2d3748);
      padding: 2px 7px;
      border-radius: 10px;
      white-space: nowrap;
      flex-shrink: 0;
      margin-right: auto;
    }

    .ncc-float-card__controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 8px 14px;
      background: var(--ncc-surface-elevated, #262a3b);
      border-top: 1px solid var(--ncc-border, #2d3748);
      flex-shrink: 0;
    }

    /* ── Resize handles ─────────────────────────────────────── */
    .ncc-float-resize {
      position: absolute;
      z-index: 2;
      background: transparent;
    }

    .ncc-float-resize--e {
      right: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      cursor: ew-resize;
    }

    .ncc-float-resize--s {
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      cursor: ns-resize;
    }

    .ncc-float-resize--se {
      right: 0;
      bottom: 0;
      width: 18px;
      height: 18px;
      cursor: nwse-resize;
      /* visual grip dots */
      background-image:
        radial-gradient(circle, var(--ncc-text-muted, #8892a4) 1px, transparent 1px);
      background-size: 5px 5px;
      background-position: 1px 1px;
      opacity: 0.4;
      border-radius: 0 0 10px 0;
    }
    .ncc-float-resize--se:hover { opacity: 0.8; }

    /* ── Shared brand/info row ──────────────────────────────── */
    .ncc-float-brand {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ncc-float-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ncc-border, #2d3748);
      flex-shrink: 0;
    }

    .ncc-float-status-dot--live {
      background: var(--ncc-success, #22c55e);
      box-shadow: 0 0 6px var(--ncc-success, #22c55e);
    }

    .ncc-float-brand-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ncc-text, #eef0f5);
    }

    .ncc-float-pcount {
      font-size: 0.68rem;
      color: var(--ncc-text-muted, #8892a4);
      background: var(--ncc-surface, #1c1f2e);
      padding: 1px 6px;
      border-radius: 10px;
    }

    .ncc-float-icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--ncc-text-muted, #8892a4);
      padding: 4px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .ncc-float-icon-btn:hover {
      color: var(--ncc-text, #eef0f5);
      background: var(--ncc-border, #2d3748);
    }

    /* ── Compact control buttons ────────────────────────────── */
    .ncc-float-ctrl {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: var(--ncc-surface, #1c1f2e);
      color: var(--ncc-text, #eef0f5);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, transform 0.1s;
      flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .ncc-float-ctrl:hover { background: var(--ncc-border, #2d3748); }
    .ncc-float-ctrl:active { transform: scale(0.92); }

    .ncc-float-ctrl--off {
      background: transparent;
      border: 1.5px solid var(--ncc-danger, #ef4444);
      color: var(--ncc-danger, #ef4444);
    }
    .ncc-float-ctrl--off:hover { background: rgba(239,68,68,0.12); }

    .ncc-float-ctrl--end {
      background: var(--ncc-danger, #ef4444);
      color: #fff;
    }
    .ncc-float-ctrl--end:hover { background: #dc2626; }

    /* ── Spinners ───────────────────────────────────────────── */
    .ncc-spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid var(--ncc-border, #2d3748);
      border-top-color: var(--ncc-primary, #D42222);
      animation: ncc-spin 0.8s linear infinite;
    }

    .ncc-spinner-sm {
      width: 20px; height: 20px; border-radius: 50%;
      border: 2px solid var(--ncc-border, #2d3748);
      border-top-color: var(--ncc-primary, #D42222);
      animation: ncc-spin 0.8s linear infinite;
    }

    @keyframes ncc-spin { to { transform: rotate(360deg); } }

    /* ── Expanded overlay ───────────────────────────────────── */
    .ncc-float-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      background: var(--ncc-bg, #111216);
      color: var(--ncc-text, #eef0f5);
      font-family: var(--ncc-font-family, 'Inter', system-ui, sans-serif);
    }

    .ncc-float-overlay__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--ncc-surface, #1c1f2e);
      border-bottom: 1px solid var(--ncc-border, #2d3748);
      flex-shrink: 0;
    }

    .ncc-float-overlay__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ncc-float-overlay__body {
      flex: 1;
      display: flex;
      overflow: hidden;
      min-height: 0;
    }

    .ncc-float-overlay__stage {
      flex: 1;
      position: relative;
      overflow: hidden;
      min-width: 0;
    }

    .ncc-float-overlay__sidebar {
      width: 280px;
      flex-shrink: 0;
      overflow: hidden;
    }

    .ncc-float-overlay__connecting {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; color: var(--ncc-text-muted, #8892a4);
    }

    @media (max-width: 640px) {
      .ncc-float-overlay__body { flex-direction: column; }
      .ncc-float-overlay__sidebar {
        width: 100%;
        height: 220px;
        border-left: none;
        border-top: 1px solid var(--ncc-border, #2d3748);
      }
    }
  `],
})
export class FloatingMeetingComponent implements OnInit, OnDestroy {
  readonly meetingState = inject(MeetingStateService);
  readonly chatService = inject(ChatService);
  readonly session = inject(MeetingSessionService);
  private chime = inject(ChimeService);
  private deviceService = inject(DeviceService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  isExpanded = false;
  chatOpen = false;
  participantsOpen = false;
  unreadCount = 0;

  state: MeetingState = {
    status: 'idle',
    isLocalMuted: false,
    isLocalVideoOn: false,
    isSharingScreen: false,
    layout: 'focused',
    activeSpeakerId: null,
    participants: [],
    localParticipant: null,
  };

  posX = 0;
  posY = 0;
  cardWidth = 300;
  cardHeight = 220;

  private readonly MIN_WIDTH = 220;
  private readonly MIN_HEIGHT = 160;
  private readonly MAX_WIDTH = 640;
  private readonly MAX_HEIGHT = 480;
  private readonly DRAG_THRESHOLD = 5;
  private dragging = false;

  get brandName(): string {
    return this.session.config?.brandName ?? 'Meeting';
  }

  get isConnected(): boolean {
    return this.state.status === 'connected';
  }

  get participantCount(): number {
    return this.state.participants.length;
  }

  get activeSpeaker(): Participant | null {
    if (this.state.participants.length === 0) return null;
    return (
      this.state.participants.find((p) => p.attendeeId === this.state.activeSpeakerId) ??
      this.state.participants[0] ??
      null
    );
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.posX = Math.max(12, window.innerWidth - this.cardWidth - 12);
      this.posY = Math.max(12, window.innerHeight - this.cardHeight - 12);
    }

    const cfg = this.session.config;
    if (cfg && !cfg.demoMode && cfg.meetingConfig) {
      this.chime.joinMeeting(cfg.meetingConfig)
        .then(() => this.deviceService.loadDevices())
        .catch((err) => console.error('[FloatingMeeting] Join failed', err));
    }

    this.meetingState.state$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.state = s;
      this.cdr.markForCheck();
    });

    this.chatService.chatState$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.chatOpen = s.isOpen;
      this.unreadCount = s.unreadCount;
      this.cdr.markForCheck();
    });
  }

  expand(event?: Event): void {
    event?.stopPropagation();
    this.isExpanded = true;
    this.cdr.markForCheck();
  }

  minimize(): void {
    this.isExpanded = false;
    this.cdr.markForCheck();
  }

  toggleChatPanel(): void {
    if (!this.chatOpen) {
      this.participantsOpen = false;
    }
    this.chatService.toggleChat();
  }

  toggleParticipantsPanel(): void {
    this.participantsOpen = !this.participantsOpen;
    if (this.participantsOpen) {
      this.chatService.closeChat();
    }
    this.cdr.markForCheck();
  }

  closeParticipants(): void {
    this.participantsOpen = false;
    this.cdr.markForCheck();
  }

  toggleMute(event?: Event): void {
    event?.stopPropagation();
    this.meetingState.toggleMute();
  }

  toggleVideo(event?: Event): void {
    event?.stopPropagation();
    this.meetingState.toggleVideo();
  }

  switchCamera(event?: Event): void {
    event?.stopPropagation();
    this.meetingState.switchCameraFacing();
  }

  endMeeting(event?: Event): void {
    event?.stopPropagation();
    this.chatService.clearMessages();
    this.session.end();
  }

  onHeaderPointerDown(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) return;

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startPosX = this.posX;
    const startPosY = this.posY;
    this.dragging = false;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startClientX;
      const dy = e.clientY - startClientY;

      if (!this.dragging && (Math.abs(dx) + Math.abs(dy)) > this.DRAG_THRESHOLD) {
        this.dragging = true;
      }

      if (this.dragging) {
        const vw = isPlatformBrowser(this.platformId) ? window.innerWidth : 800;
        const vh = isPlatformBrowser(this.platformId) ? window.innerHeight : 600;
        this.posX = Math.max(4, Math.min(vw - this.cardWidth - 4, startPosX + dx));
        this.posY = Math.max(4, Math.min(vh - this.cardHeight - 4, startPosY + dy));
        this.cdr.markForCheck();
      }
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setTimeout(() => { this.dragging = false; }, 50);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  onResizePointerDown(event: PointerEvent, dir: 'e' | 's' | 'se'): void {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startW = this.cardWidth;
    const startH = this.cardHeight;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const vw = isPlatformBrowser(this.platformId) ? window.innerWidth : 800;
      const vh = isPlatformBrowser(this.platformId) ? window.innerHeight : 600;

      if (dir === 'e' || dir === 'se') {
        const maxW = Math.min(this.MAX_WIDTH, vw - this.posX - 4);
        this.cardWidth = Math.max(this.MIN_WIDTH, Math.min(maxW, startW + dx));
      }
      if (dir === 's' || dir === 'se') {
        const maxH = Math.min(this.MAX_HEIGHT, vh - this.posY - 4);
        this.cardHeight = Math.max(this.MIN_HEIGHT, Math.min(maxH, startH + dy));
      }

      // Clamp position if card grew past viewport edge
      this.posX = Math.min(this.posX, vw - this.cardWidth - 4);
      this.posY = Math.min(this.posY, vh - this.cardHeight - 4);

      this.cdr.markForCheck();
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
