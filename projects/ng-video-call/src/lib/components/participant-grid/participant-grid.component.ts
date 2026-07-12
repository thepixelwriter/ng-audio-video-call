import {
  Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy,
  inject, ChangeDetectorRef, ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Participant, ParticipantLayout } from '../../models/participant.models';
import { VideoTileComponent } from '../video-tile/video-tile.component';

@Component({
  selector: 'ncc-participant-grid',
  standalone: true,
  imports: [CommonModule, VideoTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <!-- Focused: active speaker large + bottom horizontal strip -->
    <div class="ncc-focused" *ngIf="layout === 'focused'">
      <div class="ncc-focused__main">
        <ncc-video-tile *ngIf="primaryParticipant" [participant]="primaryParticipant"></ncc-video-tile>
        <div class="ncc-focused__empty" *ngIf="!primaryParticipant">Waiting for participants…</div>
      </div>
      <div class="ncc-focused__strip" *ngIf="stripParticipants.length > 0">
        <div class="ncc-focused__thumb" *ngFor="let p of stripParticipants; trackBy: trackById">
          <ncc-video-tile [participant]="p"></ncc-video-tile>
        </div>
      </div>
    </div>

    <!-- Grid: equal landscape tiles filling viewport -->
    <div class="ncc-grid" [ngClass]="'ncc-grid--cols-' + gridCols" *ngIf="layout === 'grid'">
      <div class="ncc-grid__cell" *ngFor="let p of participants; trackBy: trackById">
        <ncc-video-tile [participant]="p"></ncc-video-tile>
      </div>
    </div>

    <!-- Spotlight: active speaker large + right sidebar strip -->
    <div class="ncc-spotlight" *ngIf="layout === 'spotlight'">
      <div class="ncc-spotlight__main">
        <ncc-video-tile *ngIf="primaryParticipant" [participant]="primaryParticipant"></ncc-video-tile>
      </div>
      <div class="ncc-spotlight__sidebar" *ngIf="stripParticipants.length > 0">
        <div class="ncc-spotlight__thumb" *ngFor="let p of stripParticipants; trackBy: trackById">
          <ncc-video-tile [participant]="p"></ncc-video-tile>
        </div>
      </div>
    </div>

    <!-- Screenshare: shared content large + bottom strip -->
    <div class="ncc-screenshare" *ngIf="layout === 'screenshare'">
      <div class="ncc-screenshare__main">
        <ncc-video-tile *ngIf="screenSharer" [participant]="screenSharer"></ncc-video-tile>
        <div class="ncc-focused__empty" *ngIf="!screenSharer">No screen share active</div>
      </div>
      <div class="ncc-focused__strip" *ngIf="participants.length > 0">
        <div class="ncc-focused__thumb" *ngFor="let p of participants; trackBy: trackById">
          <ncc-video-tile [participant]="p"></ncc-video-tile>
        </div>
      </div>
    </div>

    <!-- Picture-in-Picture: remote participant full view + draggable self-view overlay -->
    <div class="ncc-pip" #pipContainer *ngIf="layout === 'pip'">
      <div class="ncc-pip__main">
        <ncc-video-tile *ngIf="pipMainParticipant" [participant]="pipMainParticipant"></ncc-video-tile>
        <div class="ncc-focused__empty" *ngIf="!pipMainParticipant">Waiting for participants…</div>
      </div>

      <div class="ncc-pip__self"
           *ngIf="pipSelfParticipant"
           [class.ncc-pip__self--default]="pipSelfLeft === null"
           [style.left.px]="pipSelfLeft !== null ? pipSelfLeft : null"
           [style.top.px]="pipSelfTop !== null ? pipSelfTop : null"
           (pointerdown)="onPipSelfPointerDown($event)"
           title="Drag to reposition">
        <ncc-video-tile [participant]="pipSelfParticipant"></ncc-video-tile>
        <div class="ncc-pip__self-drag-hint">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="2" cy="2" r="1"/><circle cx="5" cy="2" r="1"/><circle cx="8" cy="2" r="1"/>
            <circle cx="2" cy="5" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="8" cy="5" r="1"/>
            <circle cx="2" cy="8" r="1"/><circle cx="5" cy="8" r="1"/><circle cx="8" cy="8" r="1"/>
          </svg>
        </div>
      </div>
    </div>

  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* ── Focused layout ─────────────────────────────── */
    .ncc-focused {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .ncc-focused__main {
      flex: 1;
      min-height: 0;
      position: relative;
    }

    .ncc-focused__empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ncc-text-muted);
      font-size: 0.875rem;
      background: var(--ncc-surface);
      border-radius: var(--ncc-border-radius);
    }

    .ncc-focused__strip {
      display: flex;
      flex-direction: row;
      gap: 12px;
      flex-shrink: 0;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .ncc-focused__strip::-webkit-scrollbar { height: 4px; }
    .ncc-focused__strip::-webkit-scrollbar-thumb {
      background: var(--ncc-border);
      border-radius: 2px;
    }

    .ncc-focused__thumb {
      aspect-ratio: 16 / 9;
      height: 110px;
      flex-shrink: 0;
    }

    /* ── Grid layout ───────────────────────────────── */
    .ncc-grid {
      display: grid;
      width: 100%;
      min-height: 100%;
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      align-content: center;
    }

    .ncc-grid--cols-1 { grid-template-columns: 1fr; }
    .ncc-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
    .ncc-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
    .ncc-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }
    .ncc-grid--cols-5 { grid-template-columns: repeat(5, 1fr); }

    .ncc-grid__cell {
      aspect-ratio: 16 / 9;
      min-width: 0;
      overflow: hidden;
      border-radius: var(--ncc-border-radius, 8px);
    }

    /* ── Spotlight layout ──────────────────────────── */
    .ncc-spotlight {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .ncc-spotlight__main {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }

    .ncc-spotlight__sidebar {
      width: 180px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .ncc-spotlight__thumb {
      aspect-ratio: 16 / 9;
      width: 100%;
      flex-shrink: 0;
    }

    /* ── Screenshare layout ────────────────────────── */
    .ncc-screenshare {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      gap: 12px;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .ncc-screenshare__main {
      flex: 1;
      min-height: 0;
      position: relative;
    }

    /* ── Picture-in-Picture layout ─────────────────── */
    .ncc-pip {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }

    .ncc-pip__main {
      position: absolute;
      inset: 0;
    }

    .ncc-pip__self {
      position: absolute;
      width: 160px;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.55),
        0 0 0 2px rgba(255, 255, 255, 0.18);
      cursor: grab;
      z-index: 10;
      touch-action: none;
      transition: box-shadow 0.2s, transform 0.1s;
      will-change: transform;
    }

    /* Default CSS position (bottom-right) — removed once JS takes over */
    .ncc-pip__self--default {
      bottom: 20px;
      right: 20px;
    }

    .ncc-pip__self:active {
      cursor: grabbing;
      transform: scale(1.03);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.65),
        0 0 0 2.5px rgba(255, 255, 255, 0.28);
    }

    .ncc-pip__self-drag-hint {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.55);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .ncc-pip__self:hover .ncc-pip__self-drag-hint {
      opacity: 1;
    }

    /* ── Responsive ────────────────────────────────── */
    @media (max-width: 640px) {
      .ncc-focused__thumb { height: 80px; }

      .ncc-spotlight { flex-direction: column; }
      .ncc-spotlight__sidebar {
        width: 100%;
        height: 90px;
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
      }
      .ncc-spotlight__thumb { height: 100%; width: auto; aspect-ratio: 16 / 9; }

      .ncc-pip__self { width: 110px; }
      .ncc-pip__self--default { bottom: 12px; right: 12px; }
    }

    @media (max-width: 599px) {
      .ncc-grid {
        grid-template-columns: 1fr !important;
        gap: 10px;
        padding: 10px;
      }
    }

    @media (min-width: 600px) and (max-width: 899px) {
      .ncc-grid--cols-3,
      .ncc-grid--cols-4,
      .ncc-grid--cols-5 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
})
export class ParticipantGridComponent implements OnChanges {
  @Input() participants: Participant[] = [];
  @Input() layout: ParticipantLayout = 'focused';
  @Input() activeSpeakerId: string | null = null;

  @ViewChild('pipContainer') private pipContainerEl?: ElementRef<HTMLDivElement>;

  private cdr = inject(ChangeDetectorRef);

  gridCols = 1;
  primaryParticipant: Participant | null = null;
  stripParticipants: Participant[] = [];
  screenSharer: Participant | null = null;
  pipMainParticipant: Participant | null = null;
  pipSelfParticipant: Participant | null = null;

  pipSelfLeft: number | null = null;
  pipSelfTop: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    this.primaryParticipant =
      this.participants.find((p) => p.attendeeId === this.activeSpeakerId) ??
      this.participants[0] ??
      null;

    this.stripParticipants = this.participants.filter((p) => p !== this.primaryParticipant);
    this.screenSharer = this.participants.find((p) => p.isSharingScreen) ?? null;

    // PiP participants
    const remote = this.participants.filter((p) => !p.isLocal);
    this.pipMainParticipant =
      remote.find((p) => p.attendeeId === this.activeSpeakerId) ??
      remote[0] ??
      this.participants[0] ??
      null;
    this.pipSelfParticipant = this.participants.find((p) => p.isLocal) ?? null;

    // Reset self-view position when entering PiP mode
    if (changes['layout']?.currentValue === 'pip' && changes['layout'].previousValue !== 'pip') {
      this.pipSelfLeft = null;
      this.pipSelfTop = null;
    }

    if (this.layout === 'grid') {
      this.gridCols = this.computeGridCols(this.participants.length);
    }
  }

  trackById(_: number, p: Participant): string {
    return p.attendeeId;
  }

  onPipSelfPointerDown(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const selfEl = event.currentTarget as HTMLElement;
    const containerEl = this.pipContainerEl?.nativeElement;
    if (!containerEl) return;

    const selfRect = selfEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    // Capture current rendered position relative to container
    const startLeft = selfRect.left - containerRect.left;
    const startTop = selfRect.top - containerRect.top;
    const selfW = selfRect.width;
    const selfH = selfRect.height;

    // Switch from CSS default positioning to JS-controlled
    this.pipSelfLeft = startLeft;
    this.pipSelfTop = startTop;
    this.cdr.markForCheck();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const onMove = (e: PointerEvent) => {
      const maxLeft = containerEl.offsetWidth - selfW - 8;
      const maxTop = containerEl.offsetHeight - selfH - 8;
      this.pipSelfLeft = Math.max(8, Math.min(maxLeft, startLeft + (e.clientX - startMouseX)));
      this.pipSelfTop = Math.max(8, Math.min(maxTop, startTop + (e.clientY - startMouseY)));
      this.cdr.markForCheck();
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  private computeGridCols(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 2;
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    return Math.ceil(Math.sqrt(n));
  }
}
