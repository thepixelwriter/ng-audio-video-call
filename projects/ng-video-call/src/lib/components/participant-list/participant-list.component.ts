import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Participant } from '../../models/participant.models';
import { NccIconComponent } from '../icon/ncc-icon.component';

@Component({
  selector: 'ncc-participant-list',
  standalone: true,
  imports: [CommonModule, NccIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-plist">
      <div class="ncc-plist__header">
        <span>Participants ({{ participants.length }})</span>
        <button class="ncc-plist__close" (click)="close.emit()" title="Close participants">
          <ncc-icon name="close" [size]="18"></ncc-icon>
        </button>
      </div>
      <div class="ncc-plist__scroll">
        <div *ngFor="let p of participants; trackBy: trackById" class="ncc-plist__item">
          <div class="ncc-plist__avatar" [class.ncc-plist__avatar--speaking]="p.isActiveSpeaker">
            {{ initials(p) }}
          </div>
          <div class="ncc-plist__info">
            <span class="ncc-plist__name">
              {{ p.name || p.externalUserId }}
              <span class="ncc-plist__you" *ngIf="p.isLocal">(You)</span>
            </span>
            <span class="ncc-plist__role" *ngIf="p.isHost">Host</span>
          </div>
          <div class="ncc-plist__status">
            <span *ngIf="p.isActiveSpeaker" class="ncc-plist__speaking" title="Speaking"></span>
            <span *ngIf="p.isMuted" class="ncc-plist__icon ncc-plist__icon--danger" title="Muted">
              <ncc-icon name="mic-off" [size]="14"></ncc-icon>
            </span>
            <span *ngIf="!p.isVideoOn" class="ncc-plist__icon" title="Camera off">
              <ncc-icon name="video-off" [size]="14"></ncc-icon>
            </span>
          </div>
        </div>

        <div *ngIf="participants.length === 0" class="ncc-plist__empty">
          No participants yet
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ncc-plist {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--ncc-surface);
      border-left: 1px solid var(--ncc-border);
    }
    .ncc-plist__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--ncc-border);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--ncc-text);
      flex-shrink: 0;
    }
    .ncc-plist__close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--ncc-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .ncc-plist__close:hover {
      color: var(--ncc-text);
      background: var(--ncc-surface-elevated);
    }
    .ncc-plist__scroll {
      flex: 1;
      overflow-y: auto;
    }
    .ncc-plist__item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--ncc-border);
      transition: background 0.1s;
    }
    .ncc-plist__item:last-child { border-bottom: none; }
    .ncc-plist__item:hover { background: var(--ncc-surface-elevated); }
    .ncc-plist__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ncc-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
      transition: box-shadow 0.2s;
    }
    .ncc-plist__avatar--speaking {
      box-shadow: 0 0 0 2px var(--ncc-success);
    }
    .ncc-plist__info {
      flex: 1;
      min-width: 0;
    }
    .ncc-plist__name {
      display: block;
      font-size: 0.85rem;
      color: var(--ncc-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ncc-plist__you {
      color: var(--ncc-text-muted);
      font-size: 0.75rem;
    }
    .ncc-plist__role {
      display: block;
      font-size: 0.7rem;
      color: var(--ncc-primary);
      font-weight: 500;
    }
    .ncc-plist__status {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-shrink: 0;
    }
    .ncc-plist__icon {
      color: var(--ncc-text-muted);
      display: flex;
      align-items: center;
    }
    .ncc-plist__icon--danger { color: var(--ncc-danger); }
    .ncc-plist__speaking {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ncc-success);
      animation: speaking 1s ease-in-out infinite;
    }
    .ncc-plist__empty {
      padding: 24px 16px;
      text-align: center;
      color: var(--ncc-text-muted);
      font-size: 0.85rem;
    }
    @keyframes speaking {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
  `],
})
export class ParticipantListComponent {
  @Input() participants: Participant[] = [];
  @Output() close = new EventEmitter<void>();

  initials(p: Participant): string {
    return (p.name || p.externalUserId || '?')
      .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  trackById(_: number, p: Participant): string {
    return p.attendeeId;
  }
}
