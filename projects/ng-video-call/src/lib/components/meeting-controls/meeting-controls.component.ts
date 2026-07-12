import { Component, Output, EventEmitter, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantLayout } from '../../models/participant.models';
import { NccIconComponent } from '../icon/ncc-icon.component';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'ncc-meeting-controls',
  standalone: true,
  imports: [CommonModule, NccIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-controls" [class.ncc-controls--labeled]="showControlLabels">

      <!-- Left side: layout switcher -->
      <div class="ncc-controls__side">
        <button class="ncc-ctrl ncc-ctrl--flat" (click)="layoutChange.emit(nextLayout)" title="Switch layout">
          <ncc-icon name="layout" [size]="20"></ncc-icon>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">{{ layoutLabel }}</span>
        </button>
      </div>

      <!-- Center: main call controls -->
      <div class="ncc-controls__center">

        <!-- Mute -->
        <div class="ncc-ctrl-group">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            [class.ncc-ctrl--active]="!isMuted"
            [class.ncc-ctrl--danger]="isMuted"
            (click)="toggleMute.emit()"
            [title]="isMuted ? 'Unmute microphone' : 'Mute microphone'">
            <ncc-icon [name]="isMuted ? 'mic-off' : 'mic'" [size]="22"></ncc-icon>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">{{ isMuted ? 'Unmute' : 'Mute' }}</span>
        </div>

        <!-- Camera toggle -->
        <div class="ncc-ctrl-group">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            [class.ncc-ctrl--active]="isVideoOn"
            [class.ncc-ctrl--danger]="!isVideoOn"
            (click)="toggleVideo.emit()"
            [title]="isVideoOn ? 'Stop video' : 'Start video'">
            <ncc-icon [name]="isVideoOn ? 'video' : 'video-off'" [size]="22"></ncc-icon>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">{{ isVideoOn ? 'Stop Video' : 'Start Video' }}</span>
        </div>

        <!-- Camera flip — shown when multiple cameras available -->
        <div class="ncc-ctrl-group" *ngIf="showCameraSwitch">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            (click)="switchCamera.emit()"
            title="Switch camera (front/rear)">
            <ncc-icon name="camera-flip" [size]="22"></ncc-icon>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">Flip</span>
        </div>

        <!-- Screen share — hidden on mobile -->
        <div class="ncc-ctrl-group ncc-ctrl-group--desktop">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            [class.ncc-ctrl--active]="isSharingScreen"
            (click)="toggleScreenShare.emit()"
            title="Share screen">
            <ncc-icon name="screen-share" [size]="22"></ncc-icon>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">{{ isSharingScreen ? 'Stop Share' : 'Share' }}</span>
        </div>

        <!-- Participants -->
        <div class="ncc-ctrl-group">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            [class.ncc-ctrl--active]="isParticipantsOpen"
            (click)="toggleParticipants.emit()"
            title="Participants"
            style="position:relative">
            <ncc-icon name="people" [size]="22"></ncc-icon>
            <span class="ncc-badge" *ngIf="participantCount > 0">{{ participantCount > 99 ? '99+' : participantCount }}</span>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">People</span>
        </div>

        <!-- Chat -->
        <div class="ncc-ctrl-group">
          <button
            class="ncc-ctrl ncc-ctrl--round"
            [class.ncc-ctrl--active]="isChatOpen"
            (click)="toggleChat.emit()"
            title="Chat"
            style="position:relative">
            <ncc-icon name="chat" [size]="22"></ncc-icon>
            <span class="ncc-badge ncc-badge--unread" *ngIf="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">Chat</span>
        </div>

        <!-- Leave / End call -->
        <div class="ncc-ctrl-group">
          <button
            class="ncc-ctrl ncc-ctrl--round ncc-ctrl--leave"
            (click)="leaveMeeting.emit()"
            title="Leave meeting">
            <ncc-icon name="leave" [size]="22"></ncc-icon>
          </button>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">Leave</span>
        </div>

      </div>

      <!-- Right side: settings button -->
      <div class="ncc-controls__side ncc-controls__side--right">
        <button class="ncc-ctrl ncc-ctrl--flat ncc-ctrl--settings"
                (click)="deviceService.settingsToggle$.next()"
                title="Audio / Video settings">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span class="ncc-ctrl__label" *ngIf="showControlLabels">Settings</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .ncc-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 72px;
      flex-shrink: 0;
      background: var(--ncc-surface);
      border-top: 1px solid var(--ncc-border);
    }

    .ncc-controls--labeled {
      height: 88px;
    }

    .ncc-controls__side {
      display: flex;
      align-items: center;
      min-width: 80px;
    }
    .ncc-controls__side--right { justify-content: flex-end; }

    .ncc-controls__center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ncc-ctrl-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .ncc-ctrl {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      color: var(--ncc-text);
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .ncc-ctrl:focus-visible {
      outline: 2px solid var(--ncc-primary);
      outline-offset: 2px;
    }

    .ncc-ctrl--round {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--ncc-surface-elevated);
    }
    .ncc-ctrl--round:hover { background: var(--ncc-border); }
    .ncc-ctrl--round:active { transform: scale(0.94); }

    .ncc-ctrl--flat {
      flex-direction: column;
      gap: 3px;
      background: transparent;
      border-radius: 8px;
      padding: 6px 10px;
      color: var(--ncc-text-muted);
    }
    .ncc-ctrl--flat:hover {
      background: var(--ncc-surface-elevated);
      color: var(--ncc-text);
    }

    .ncc-ctrl--active {
      background: var(--ncc-primary);
      color: #fff;
    }
    .ncc-ctrl--active:hover { opacity: 0.88; }

    .ncc-ctrl--danger {
      background: var(--ncc-surface-elevated);
      color: var(--ncc-danger);
      border: 1.5px solid var(--ncc-danger);
    }
    .ncc-ctrl--danger:hover { opacity: 0.85; }

    .ncc-ctrl--leave {
      background: #dc2626;
      color: #fff;
    }
    .ncc-ctrl--leave:hover { background: #b91c1c; }

    .ncc-ctrl__label {
      font-size: 0.6rem;
      color: var(--ncc-text-muted);
      white-space: nowrap;
      line-height: 1;
    }

    .ncc-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: var(--ncc-primary);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }

    .ncc-badge--unread {
      background: var(--ncc-danger);
    }

    @media (max-width: 540px) {
      .ncc-controls,
      .ncc-controls--labeled { padding: 0 8px; height: 60px; }
      .ncc-controls__side { min-width: 32px; }
      .ncc-controls__center { gap: 6px; }
      .ncc-ctrl--round { width: 44px; height: 44px; }
      .ncc-ctrl__label { display: none !important; }
      .ncc-ctrl-group--desktop { display: none; }
    }

    .ncc-ctrl--settings { color: var(--ncc-text-muted); }
    .ncc-ctrl--settings:hover { color: var(--ncc-text); }

    @media (max-width: 380px) {
      .ncc-controls__side { display: none; }
      .ncc-ctrl--round { width: 38px; height: 38px; }
    }
  `],
})
export class MeetingControlsComponent {
  readonly deviceService = inject(DeviceService);
  @Input() isMuted = false;
  @Input() isVideoOn = false;
  @Input() isSharingScreen = false;
  @Input() isChatOpen = false;
  @Input() isParticipantsOpen = false;
  @Input() unreadCount = 0;
  @Input() participantCount = 0;
  @Input() layout: ParticipantLayout = 'focused';
  @Input() showCameraSwitch = false;
  /** Show text labels beneath each control button. Default: false (icons only). */
  @Input() showControlLabels = false;

  @Output() toggleMute = new EventEmitter<void>();
  @Output() toggleVideo = new EventEmitter<void>();
  @Output() toggleScreenShare = new EventEmitter<void>();
  @Output() toggleChat = new EventEmitter<void>();
  @Output() toggleParticipants = new EventEmitter<void>();
  @Output() leaveMeeting = new EventEmitter<void>();
  @Output() layoutChange = new EventEmitter<ParticipantLayout>();
  @Output() switchCamera = new EventEmitter<void>();

  get nextLayout(): ParticipantLayout {
    const layouts: ParticipantLayout[] = ['focused', 'grid', 'spotlight', 'pip', 'screenshare'];
    const idx = layouts.indexOf(this.layout);
    return layouts[(idx + 1) % layouts.length];
  }

  get layoutLabel(): string {
    const labels: Record<ParticipantLayout, string> = {
      focused: 'Focused',
      grid: 'Grid',
      spotlight: 'Spotlight',
      screenshare: 'Screen',
      pip: 'PiP',
    };
    return labels[this.layout] ?? 'Layout';
  }
}
