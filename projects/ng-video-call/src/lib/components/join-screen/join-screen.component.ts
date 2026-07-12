import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { MeetingConfig } from '../../models/meeting.models';
import { NccIconComponent } from '../icon/ncc-icon.component';

@Component({
  selector: 'ncc-join-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, NccIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-join">
      <div class="ncc-join__card">
        <div class="ncc-join__header">
          <h2>Join Meeting</h2>
          <p>Enter your meeting details to get started</p>
        </div>

        <form class="ncc-join__form" (ngSubmit)="submit()" #form="ngForm">
          <div class="ncc-join__field">
            <label>Your Name</label>
            <input [(ngModel)]="name" name="name" required placeholder="Enter your name" class="ncc-input" />
          </div>
          <div class="ncc-join__field">
            <label>Meeting ID</label>
            <input [(ngModel)]="meetingId" name="meetingId" required placeholder="Enter meeting ID" class="ncc-input" />
          </div>
          <div class="ncc-join__field">
            <label>Attendee ID</label>
            <input [(ngModel)]="attendeeId" name="attendeeId" required placeholder="Enter attendee ID" class="ncc-input" />
          </div>
          <div class="ncc-join__field">
            <label>Join Token</label>
            <input [(ngModel)]="joinToken" name="joinToken" required placeholder="Enter join token" class="ncc-input" />
          </div>

          <div class="ncc-join__options">
            <label class="ncc-join__toggle">
              <input type="checkbox" [(ngModel)]="startWithVideoOn" name="video" />
              <span>Start with video on</span>
            </label>
            <label class="ncc-join__toggle">
              <input type="checkbox" [(ngModel)]="startMuted" name="muted" />
              <span>Start muted</span>
            </label>
          </div>

          <button type="submit" class="ncc-btn-primary ncc-btn-primary--full" [disabled]="!form.valid">
            Join Meeting
          </button>

          <div class="ncc-join__divider" *ngIf="showDemoButton">
            <span>or</span>
          </div>

          <button *ngIf="showDemoButton" type="button" class="ncc-btn-demo" (click)="tryDemo.emit()">
            Launch Demo — no credentials needed
          </button>
        </form>

        <div class="ncc-join__theme-toggle">
          <button (click)="themeService.toggleMode()" class="ncc-btn-theme" [title]="themeService.currentMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
            <ncc-icon [name]="themeService.currentMode === 'dark' ? 'sun' : 'moon'" [size]="16"></ncc-icon>
            {{ themeService.currentMode === 'dark' ? 'Light mode' : 'Dark mode' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ncc-join {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; min-height: 100dvh;
      background: var(--ncc-bg);
      padding: 24px;
      font-family: var(--ncc-font-family);
    }
    .ncc-join__card {
      background: var(--ncc-surface);
      border: 1px solid var(--ncc-border);
      border-radius: 16px;
      padding: 40px;
      width: 100%; max-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .ncc-join__header { margin-bottom: 28px; }
    .ncc-join__header h2 { font-size: 1.5rem; font-weight: 700; color: var(--ncc-text); margin: 0 0 6px; }
    .ncc-join__header p { font-size: 0.875rem; color: var(--ncc-text-muted); margin: 0; }
    .ncc-join__form { display: flex; flex-direction: column; gap: 16px; }
    .ncc-join__field { display: flex; flex-direction: column; gap: 4px; }
    .ncc-join__field label { font-size: 0.8rem; font-weight: 500; color: var(--ncc-text-muted); }
    .ncc-input {
      background: var(--ncc-surface-elevated);
      border: 1px solid var(--ncc-border);
      border-radius: var(--ncc-border-radius);
      padding: 10px 14px; color: var(--ncc-text);
      font-size: 0.9rem; outline: none; width: 100%; box-sizing: border-box;
    }
    .ncc-input:focus { border-color: var(--ncc-primary); }
    .ncc-join__options { display: flex; gap: 16px; flex-wrap: wrap; }
    .ncc-join__toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--ncc-text); }
    .ncc-btn-primary {
      background: var(--ncc-primary); color: var(--ncc-primary-fg);
      border: none; padding: 12px 20px; border-radius: var(--ncc-border-radius);
      cursor: pointer; font-size: 0.95rem; font-weight: 600;
      transition: opacity 0.15s;
    }
    .ncc-btn-primary--full { width: 100%; margin-top: 8px; }
    .ncc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .ncc-btn-primary:not(:disabled):hover { opacity: 0.9; }
    .ncc-join__divider {
      display: flex; align-items: center; gap: 10px;
      color: var(--ncc-text-muted); font-size: 0.75rem;
    }
    .ncc-join__divider::before, .ncc-join__divider::after {
      content: ''; flex: 1; height: 1px; background: var(--ncc-border);
    }
    .ncc-btn-demo {
      width: 100%; padding: 12px 20px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff; border: none; border-radius: var(--ncc-border-radius);
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    .ncc-btn-demo:hover { opacity: 0.9; }
    .ncc-join__theme-toggle { margin-top: 16px; text-align: center; }
    .ncc-btn-theme {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--ncc-surface-elevated);
      border: 1px solid var(--ncc-border);
      border-radius: 20px;
      padding: 6px 14px;
      color: var(--ncc-text-muted);
      cursor: pointer; font-size: 0.8rem;
      transition: background 0.15s, color 0.15s;
    }
    .ncc-btn-theme:hover { background: var(--ncc-border); color: var(--ncc-text); }
  `],
})
export class JoinScreenComponent {
  readonly themeService = inject(ThemeService);

  @Input() showDemoButton = false;
  @Output() join = new EventEmitter<MeetingConfig & { name: string; startWithVideoOn: boolean; startMuted: boolean }>();
  @Output() tryDemo = new EventEmitter<void>();

  name = '';
  meetingId = '';
  attendeeId = '';
  joinToken = '';
  startWithVideoOn = true;
  startMuted = false;

  submit(): void {
    if (!this.name || !this.meetingId || !this.attendeeId || !this.joinToken) return;
    this.join.emit({
      name: this.name,
      meetingId: this.meetingId,
      attendeeId: this.attendeeId,
      externalUserId: this.name,
      joinToken: this.joinToken,
      startWithVideoOn: this.startWithVideoOn,
      startMuted: this.startMuted,
    });
  }
}
