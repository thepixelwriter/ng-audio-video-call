import {
  Injectable, inject, ApplicationRef, createComponent,
  EnvironmentInjector, PLATFORM_ID, EmbeddedViewRef, ComponentRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { filter, take } from 'rxjs/operators';

import { MeetingSessionService } from './meeting-session.service';
import { FloatingMeetingComponent } from '../components/floating-meeting/floating-meeting.component';
import { MeetingConfig } from '../models/meeting.models';

@Injectable({ providedIn: 'root' })
export class MeetingOverlayService {
  private appRef = inject(ApplicationRef);
  private envInjector = inject(EnvironmentInjector);
  private platformId = inject(PLATFORM_ID);
  private session = inject(MeetingSessionService);

  private floatingRef: ComponentRef<FloatingMeetingComponent> | null = null;

  get isOpen(): boolean {
    return this.floatingRef !== null;
  }

  openDemo(participantCount = 4, displayName?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.session.startDemo(participantCount, displayName);
    this.createOverlay();
  }

  open(config: MeetingConfig, brandName?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.session.start(config, brandName);
    this.createOverlay();
  }

  close(): void {
    this.session.end();
    this.destroyOverlay();
  }

  private createOverlay(): void {
    if (this.floatingRef) {
      this.destroyOverlay();
    }

    this.floatingRef = createComponent(FloatingMeetingComponent, {
      environmentInjector: this.envInjector,
    });

    this.appRef.attachView(this.floatingRef.hostView);

    const domEl = (this.floatingRef.hostView as EmbeddedViewRef<unknown>)
      .rootNodes[0] as HTMLElement;
    document.body.appendChild(domEl);

    // Auto-destroy overlay when session ends (e.g. user clicked End in the component)
    this.session.isActive$.pipe(
      filter((active) => !active),
      take(1),
    ).subscribe(() => this.destroyOverlay());
  }

  private destroyOverlay(): void {
    if (!this.floatingRef) return;
    this.appRef.detachView(this.floatingRef.hostView);
    this.floatingRef.destroy();
    this.floatingRef = null;
  }
}
