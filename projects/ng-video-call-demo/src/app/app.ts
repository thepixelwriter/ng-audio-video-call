import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MeetingRoomComponent,
  JoinScreenComponent,
  MeetingOverlayService,
  MeetingConfig,
} from 'ng-video-call';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MeetingRoomComponent, JoinScreenComponent],
  template: `
    <!-- Join screen — shown when no embedded meeting is active -->
    <ncc-join-screen
      *ngIf="!inMeeting"
      [showDemoButton]="true"
      (join)="onJoin($event)"
      (tryDemo)="launchEmbeddedDemo()">
    </ncc-join-screen>

    <!-- Embedded full-page meeting room -->
    <ncc-meeting-room
      *ngIf="inMeeting"
      [meetingConfig]="meetingConfig"
      [demoMode]="isDemoMode"
      [demoParticipantCount]="4"
      [localUserName]="isDemoMode ? 'Gaurav Sharma' : ''"
      [brandName]="isDemoMode ? 'NgVideoCall Demo' : 'NgVideoCall'"
      (meetingLeft)="onLeft()"
      (meetingFailed)="onFailed($event)"
      style="height: 100vh; display: block;">
    </ncc-meeting-room>

    <!-- Floating meeting launcher — shown on join screen -->
    <div *ngIf="!inMeeting" class="floating-launcher">
      <button class="floating-launcher__btn" (click)="launchFloatingDemo()">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
        Launch Floating Demo
      </button>
      <p class="floating-launcher__hint">
        Stays visible while you navigate — try switching pages
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .floating-launcher {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 100;
    }

    .floating-launcher__btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #7c3aed;
      color: #fff;
      border: none;
      border-radius: 24px;
      padding: 10px 22px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
      transition: opacity 0.15s, transform 0.15s;
    }

    .floating-launcher__btn:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .floating-launcher__hint {
      font-size: 0.72rem;
      color: #8892a4;
      margin: 0;
    }
  `],
})
export class App {
  private overlay = inject(MeetingOverlayService);

  inMeeting = true;
  isDemoMode = true;
  meetingConfig?: MeetingConfig;

  launchEmbeddedDemo(): void {
    this.isDemoMode = true;
    this.meetingConfig = undefined;
    this.inMeeting = true;
  }

  launchFloatingDemo(): void {
    this.overlay.openDemo(4);
  }

  onJoin(data: MeetingConfig & { name: string }): void {
    this.isDemoMode = false;
    this.meetingConfig = {
      meetingId: data.meetingId,
      attendeeId: data.attendeeId,
      externalUserId: data.name,
      joinToken: data.joinToken,
    };
    this.inMeeting = true;
  }

  onLeft(): void {
    this.inMeeting = false;
    this.isDemoMode = false;
    this.meetingConfig = undefined;
  }

  onFailed(err: Error): void {
    console.error('Meeting failed:', err);
    alert(`Meeting failed: ${err.message}`);
    this.inMeeting = false;
  }
}
