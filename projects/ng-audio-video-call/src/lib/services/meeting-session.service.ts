import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChimeService } from './chime.service';
import { DemoService } from './demo.service';
import { MeetingConfig } from '../models/meeting.models';

export interface SessionConfig {
  demoMode: boolean;
  demoParticipantCount: number;
  meetingConfig?: MeetingConfig;
  brandName?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingSessionService {
  private chime = inject(ChimeService);
  private demo = inject(DemoService);

  readonly isActive$ = new BehaviorSubject<boolean>(false);
  readonly config$ = new BehaviorSubject<SessionConfig | null>(null);

  get isActive(): boolean {
    return this.isActive$.value;
  }

  get config(): SessionConfig | null {
    return this.config$.value;
  }

  startDemo(count = 4, displayName?: string): void {
    if (this.isActive$.value) this.end();
    const cfg: SessionConfig = { demoMode: true, demoParticipantCount: count };
    this.config$.next(cfg);
    this.isActive$.next(true);
    this.demo.startDemo(count, displayName);
  }

  start(meetingConfig: MeetingConfig, brandName?: string): void {
    if (this.isActive$.value) this.end();
    const cfg: SessionConfig = {
      demoMode: false,
      demoParticipantCount: 0,
      meetingConfig,
      brandName,
    };
    this.config$.next(cfg);
    this.isActive$.next(true);
  }

  end(): void {
    const cfg = this.config$.value;
    if (!cfg) return;
    if (cfg.demoMode) {
      this.demo.stopDemo();
    } else {
      this.chime.leaveMeeting();
    }
    this.isActive$.next(false);
    this.config$.next(null);
  }
}
