import {
  Component, Input, OnChanges, OnDestroy, ElementRef, ViewChild,
  AfterViewInit, inject, SimpleChanges, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChimeService } from '../../services/chime.service';
import { Participant } from '../../models/participant.models';
import { Subject, takeUntil } from 'rxjs';
import { NccIconComponent } from '../icon/ncc-icon.component';

@Component({
  selector: 'ncc-video-tile',
  standalone: true,
  imports: [CommonModule, NccIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-tile"
         [class.ncc-tile--speaking]="participant.isActiveSpeaker"
         [class.ncc-tile--video-off]="!participant.isVideoOn">

      <video #videoEl autoplay playsinline [muted]="participant.isLocal" class="ncc-tile__video"></video>

      <div class="ncc-tile__avatar" *ngIf="!participant.isVideoOn">
        <div class="ncc-tile__initials">{{ initials }}</div>
      </div>

      <div class="ncc-tile__footer">
        <span class="ncc-tile__name">
          {{ participant.name || participant.externalUserId }}
          <span *ngIf="participant.isLocal">(You)</span>
        </span>
        <div class="ncc-tile__badges">
          <span class="ncc-tile__badge ncc-tile__badge--muted" *ngIf="participant.isMuted" title="Muted">
            <ncc-icon name="mic-off" [size]="12"></ncc-icon>
          </span>
          <span class="ncc-tile__badge ncc-tile__badge--screen" *ngIf="participant.isSharingScreen" title="Sharing screen">
            <ncc-icon name="screen-share" [size]="12"></ncc-icon>
          </span>
        </div>
      </div>

      <div class="ncc-tile__speaking-ring" *ngIf="participant.isActiveSpeaker && !participant.isMuted"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
    }

    .ncc-tile {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: var(--ncc-surface);
      border-radius: var(--ncc-border-radius);
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color 0.25s ease;
    }

    .ncc-tile--speaking {
      border-color: var(--ncc-primary);
    }

    .ncc-tile__video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .ncc-tile--video-off .ncc-tile__video {
      display: none;
    }

    .ncc-tile__avatar {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ncc-surface-elevated);
    }

    .ncc-tile__initials {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--ncc-primary);
      color: var(--ncc-primary-fg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .ncc-tile__footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 80px 12px 12px;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.78) 0%,
        rgba(0,0,0,0.65) 12%,
        rgba(0,0,0,0.48) 28%,
        rgba(0,0,0,0.28) 50%,
        rgba(0,0,0,0.10) 72%,
        rgba(0,0,0,0.02) 88%,
        transparent 100%
      );
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 6px;
    }

    .ncc-tile__name {
      color: #fff;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }

    .ncc-tile__badges {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .ncc-tile__badge {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .ncc-tile__badge--muted {
      background: var(--ncc-danger);
    }

    .ncc-tile__badge--screen {
      background: var(--ncc-primary);
    }

    .ncc-tile__speaking-ring {
      position: absolute;
      inset: 0;
      border-radius: calc(var(--ncc-border-radius) - 2px);
      box-shadow: inset 0 0 0 2px var(--ncc-primary);
      animation: speaking-pulse 1.2s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes speaking-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `],
})
export class VideoTileComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) participant!: Participant;
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  private chime = inject(ChimeService);
  private destroy$ = new Subject<void>();

  get initials(): string {
    const name = this.participant.name || this.participant.externalUserId || '?';
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  ngAfterViewInit(): void {
    this.bindVideo();
    this.chime.videoTileUpdate$.pipe(takeUntil(this.destroy$)).subscribe(({ tileId, attendeeId, active }) => {
      if (attendeeId === this.participant.attendeeId && active && tileId != null) {
        this.chime.bindVideoTile(tileId, this.videoEl.nativeElement);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['participant'] || !this.videoEl) return;
    if (this.participant.isVideoOn && this.participant.tileId != null) {
      this.bindVideo();
    } else if (!this.participant.isVideoOn) {
      // Release the stream reference so the browser clears the video frame
      // and the avatar *ngIf renders correctly
      this.videoEl.nativeElement.srcObject = null;
    }
  }

  private bindVideo(): void {
    const tileId = this.participant.tileId;
    if (tileId != null && this.videoEl) {
      this.chime.bindVideoTile(tileId, this.videoEl.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
