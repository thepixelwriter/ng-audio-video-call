import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ChimeService } from '../../services/chime.service';
import { MeetingStateService, MeetingState } from '../../services/meeting-state.service';
import { ChatService } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';
import { DeviceService } from '../../services/device.service';
import { DemoService } from '../../services/demo.service';

import { MeetingConfig, MeetingOptions } from '../../models/meeting.models';
import { ThemeConfig } from '../../models/theme.models';
import { ParticipantLayout } from '../../models/participant.models';

import { ParticipantGridComponent } from '../participant-grid/participant-grid.component';
import { MeetingControlsComponent } from '../meeting-controls/meeting-controls.component';
import { ChatPanelComponent } from '../chat-panel/chat-panel.component';
import { ParticipantListComponent } from '../participant-list/participant-list.component';

@Component({
  selector: 'ncc-meeting-room',
  standalone: true,
  imports: [
    CommonModule,
    ParticipantGridComponent,
    MeetingControlsComponent,
    ChatPanelComponent,
    ParticipantListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-room" [attr.data-theme]="themeMode">
      <audio #audioEl style="display:none" autoplay></audio>

      <div class="ncc-room__header" *ngIf="showHeader">
        <div class="ncc-room__brand">
          <img *ngIf="logoUrl" [src]="logoUrl" class="ncc-room__logo" alt="logo" />
          <span class="ncc-room__title">{{ brandName || 'Meeting' }}</span>
        </div>
        <div class="ncc-room__meeting-id" *ngIf="meetingConfig">
          ID: {{ meetingConfig.meetingId }}
        </div>
        <div class="ncc-room__status" [class]="'ncc-status--' + state.status">
          {{ statusLabel }}
        </div>
      </div>

      <div class="ncc-room__body">
        <div class="ncc-room__stage">
          <div class="ncc-room__connecting" *ngIf="state.status === 'connecting' || state.status === 'reconnecting'">
            <div class="ncc-spinner"></div>
            <p>{{ state.status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…' }}</p>
          </div>

          <div class="ncc-room__error" *ngIf="state.status === 'failed'">
            <p>Failed to connect to the meeting.</p>
            <button class="ncc-btn-primary" (click)="retryJoin()">Retry</button>
          </div>

          <ncc-participant-grid
            *ngIf="state.status === 'connected'"
            [participants]="state.participants"
            [layout]="state.layout"
            [activeSpeakerId]="state.activeSpeakerId">
          </ncc-participant-grid>
        </div>

        <div class="ncc-room__sidebar" *ngIf="showParticipantList || chatOpen || showSettings">
          <ncc-participant-list *ngIf="showParticipantList" [participants]="state.participants" (close)="showParticipantList = false"></ncc-participant-list>
          <ncc-chat-panel *ngIf="chatOpen"></ncc-chat-panel>
          <div class="ncc-settings-panel" *ngIf="showSettings">
            <div class="ncc-settings__hdr">
              <span>Audio &amp; Video Settings</span>
              <button class="ncc-ctrl ncc-ctrl--flat" (click)="showSettings = false" title="Close settings">&#x2715;</button>
            </div>
            <div class="ncc-settings__body">
              <ng-container *ngIf="deviceService.deviceState$ | async as dev">
                <div class="ncc-settings__group">
                  <label class="ncc-settings__lbl">Microphone</label>
                  <select class="ncc-settings__sel" [value]="dev.selectedAudioInput" (change)="deviceService.selectAudioInput($any($event.target).value)">
                    <option *ngFor="let d of dev.audioInputDevices" [value]="d.deviceId">{{ d.label || d.deviceId }}</option>
                  </select>
                </div>
                <div class="ncc-settings__group">
                  <label class="ncc-settings__lbl">Speaker</label>
                  <select class="ncc-settings__sel" [value]="dev.selectedAudioOutput" (change)="deviceService.selectAudioOutput($any($event.target).value)" [disabled]="!isSpeakerSelectionSupported">
                    <option *ngFor="let d of dev.audioOutputDevices" [value]="d.deviceId">{{ d.label || d.deviceId }}</option>
                  </select>
                  <span *ngIf="!isSpeakerSelectionSupported" class="ncc-settings__notice">Speaker selection is not supported by this browser.</span>
                </div>
                <div class="ncc-settings__group">
                  <label class="ncc-settings__lbl">Camera</label>
                  <select class="ncc-settings__sel" [value]="dev.selectedVideoInput" (change)="deviceService.selectVideoInput($any($event.target).value)">
                    <option *ngFor="let d of dev.videoInputDevices" [value]="d.deviceId">{{ d.label || d.deviceId }}</option>
                  </select>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <ncc-meeting-controls
        [isMuted]="state.isLocalMuted"
        [isVideoOn]="state.isLocalVideoOn"
        [isSharingScreen]="state.isSharingScreen"
        [isChatOpen]="chatOpen"
        [unreadCount]="unreadCount"
        [layout]="state.layout"
        [showCameraSwitch]="hasCameraSwitch"
        [showControlLabels]="showControlLabels"
        (toggleMute)="meetingState.toggleMute()"
        (toggleVideo)="meetingState.toggleVideo()"
        (toggleScreenShare)="meetingState.toggleScreenShare()"
        (toggleChat)="chatService.toggleChat()"
        (toggleParticipants)="showParticipantList = !showParticipantList"
        (leaveMeeting)="leave()"
        (layoutChange)="meetingState.setLayout($event)"
        (switchCamera)="meetingState.switchCameraFacing()">
      </ncc-meeting-controls>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; font-family: var(--ncc-font-family); font-size: var(--ncc-font-size-base); }

    .ncc-room {
      display: flex; flex-direction: column;
      width: 100%; height: 100%;
      background: var(--ncc-bg);
      color: var(--ncc-text);
      overflow: hidden;
    }

    .ncc-room__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px;
      background: var(--ncc-surface);
      border-bottom: 1px solid var(--ncc-border);
      flex-shrink: 0;
    }
    .ncc-room__brand { display: flex; align-items: center; gap: 8px; }
    .ncc-room__logo { height: 28px; }
    .ncc-room__title { font-weight: 600; font-size: 1rem; }
    .ncc-room__meeting-id { font-size: 0.75rem; color: var(--ncc-text-muted); }
    .ncc-room__status { font-size: 0.75rem; padding: 3px 8px; border-radius: 12px; background: var(--ncc-surface-elevated); }
    .ncc-status--connected { color: var(--ncc-success); }
    .ncc-status--connecting, .ncc-status--reconnecting { color: var(--ncc-warning); }
    .ncc-status--failed { color: var(--ncc-danger); }

    .ncc-room__body {
      flex: 1; display: flex; overflow: hidden; min-height: 0;
    }
    .ncc-room__stage { flex: 1; position: relative; overflow: hidden; min-width: 0; }
    .ncc-room__sidebar {
      width: 340px; flex-shrink: 0;
      display: flex; flex-direction: column;
      border-left: 1px solid var(--ncc-border);
      overflow: hidden;
    }

    .ncc-room__connecting, .ncc-room__error {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; color: var(--ncc-text-muted);
    }

    .ncc-spinner {
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid var(--ncc-border);
      border-top-color: var(--ncc-primary);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ncc-btn-primary {
      background: var(--ncc-primary); color: var(--ncc-primary-fg);
      border: none; padding: 10px 20px; border-radius: var(--ncc-border-radius);
      cursor: pointer; font-size: 0.9rem; font-weight: 500;
    }

    .ncc-settings-panel { display: flex; flex-direction: column; height: 100%; }
    .ncc-settings__hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--ncc-border);
      font-weight: 600; font-size: 0.9rem; flex-shrink: 0;
    }
    .ncc-settings__body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 20px; }
    .ncc-settings__group { display: flex; flex-direction: column; gap: 6px; }
    .ncc-settings__lbl { font-size: 0.75rem; font-weight: 600; color: var(--ncc-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .ncc-settings__sel {
      width: 100%; padding: 8px 10px; border-radius: var(--ncc-border-radius);
      border: 1px solid var(--ncc-border); background: var(--ncc-surface-elevated);
      color: var(--ncc-text); font-size: 0.875rem; cursor: pointer;
    }
    .ncc-settings__sel:focus { outline: 2px solid var(--ncc-primary); outline-offset: 1px; }
    .ncc-settings__sel:disabled { opacity: 0.5; cursor: not-allowed; }
    .ncc-settings__notice { font-size: 0.75rem; color: var(--ncc-text-muted); margin-top: 4px; display: block; }

    @media (max-width: 768px) {
      .ncc-room__sidebar {
        position: absolute; right: 0; top: 0; bottom: 72px;
        z-index: 20; box-shadow: -4px 0 16px rgba(0,0,0,0.3);
      }
    }
  `],
})
export class MeetingRoomComponent implements OnInit, OnDestroy {
  @Input() meetingConfig?: MeetingConfig;
  @Input() meetingOptions: MeetingOptions = {};
  @Input() theme?: ThemeConfig;
  @Input() showHeader = true;
  @Input() logoUrl?: string;
  @Input() brandName?: string;
  @Input() demoMode = false;
  @Input() demoParticipantCount = 3;
  /** Display name shown for the local participant. Defaults to 'Guest' when not provided. */
  @Input() localUserName = '';
  /** Show text labels beneath control bar buttons. Default: false (icons only). */
  @Input() showControlLabels = false;

  @Output() meetingLeft = new EventEmitter<void>();
  @Output() meetingFailed = new EventEmitter<Error>();

  @ViewChild('audioEl') audioEl!: ElementRef<HTMLAudioElement>;

  readonly chime = inject(ChimeService);
  readonly meetingState = inject(MeetingStateService);
  readonly chatService = inject(ChatService);
  readonly deviceService = inject(DeviceService);
  private themeService = inject(ThemeService);
  private demoService = inject(DemoService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  state: MeetingState = {
    status: 'idle',
    isLocalMuted: false,
    isLocalVideoOn: false,
    isSharingScreen: false,
    layout: 'pip',
    activeSpeakerId: null,
    participants: [],
    localParticipant: null,
  };

  chatOpen = false;
  showParticipantList = false;
  showSettings = false;
  unreadCount = 0;
  themeMode = 'dark';

  get hasCameraSwitch(): boolean {
    return this.meetingState.hasCameraSwitch;
  }

  get isSpeakerSelectionSupported(): boolean {
    return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      idle: 'Idle', connecting: 'Connecting', connected: 'Connected',
      reconnecting: 'Reconnecting', disconnected: 'Disconnected', failed: 'Failed',
    };
    return labels[this.state.status] ?? this.state.status;
  }

  ngOnInit(): void {
    this.deviceService.checkPermissions();

    if (this.theme) {
      this.themeService.apply(this.theme);
    }

    this.themeService.currentTheme$.pipe(takeUntil(this.destroy$)).subscribe((t) => {
      this.themeMode = t.mode;
      this.cdr.markForCheck();
    });

    this.meetingState.state$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.state = s;
      this.cdr.markForCheck();
    });

    this.chatService.chatState$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.chatOpen = s.isOpen;
      this.unreadCount = s.unreadCount;
      this.cdr.markForCheck();
    });

    this.deviceService.settingsToggle$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showSettings = !this.showSettings;
      if (this.showSettings) {
        if (this.chatOpen) this.chatService.toggleChat();
        this.showParticipantList = false;
      }
      this.cdr.markForCheck();
    });

    if (this.demoMode) {
      this.demoService.startDemo(this.demoParticipantCount, this.localUserName || 'Guest User');
    } else if (this.meetingConfig) {
      this.joinMeeting();
    }
  }

  async joinMeeting(): Promise<void> {
    if (!this.meetingConfig) return;
    try {
      // Pass 1: enumerate before getUserMedia (labels may be empty)
      await this.deviceService.loadDevices();

      await this.chime.joinMeeting(this.meetingConfig, { ...this.meetingOptions, localUserName: this.localUserName || undefined });

      // Pass 2: enumerate after session start to get populated labels
      await this.deviceService.loadDevices();

      // Wait for audioVideoDidStart before selecting audio input — ensures
      // the WebRTC peer connection is fully negotiated so the audio track
      // is included in the SDP exchange (fixes intermittent one-way audio)
      await firstValueFrom(
        this.chime.meetingStatus$.pipe(filter(s => s === 'connected'))
      );

      const dev = this.deviceService.deviceState$.value;

      await this.deviceService.selectAudioInput(dev.selectedAudioInput || 'default');

      if (this.audioEl?.nativeElement) {
        await this.chime.bindAudioElement(this.audioEl.nativeElement);
      }

      if (this.isSpeakerSelectionSupported && dev.selectedAudioOutput) {
        await this.deviceService.selectAudioOutput(dev.selectedAudioOutput);
      }
    } catch (err) {
      this.meetingFailed.emit(err as Error);
    }
  }

  async retryJoin(): Promise<void> {
    await this.joinMeeting();
  }

  async leave(): Promise<void> {
    if (this.demoMode) {
      this.demoService.stopDemo();
    } else {
      await this.chime.leaveMeeting();
    }
    this.chatService.clearMessages();
    this.meetingLeft.emit();
  }

  ngOnDestroy(): void {
    if (this.demoMode) {
      this.demoService.stopDemo();
    } else {
      this.chime.leaveMeeting();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
