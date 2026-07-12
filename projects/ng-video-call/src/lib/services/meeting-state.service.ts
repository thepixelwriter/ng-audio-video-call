import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { ChimeService } from './chime.service';
import { DeviceService } from './device.service';
import { Participant, ParticipantLayout } from '../models/participant.models';
import { MeetingStatus } from '../models/meeting.models';

export interface MeetingState {
  status: MeetingStatus;
  isLocalMuted: boolean;
  isLocalVideoOn: boolean;
  isSharingScreen: boolean;
  layout: ParticipantLayout;
  activeSpeakerId: string | null;
  participants: Participant[];
  localParticipant: Participant | null;
}

@Injectable({ providedIn: 'root' })
export class MeetingStateService {
  private chime = inject(ChimeService);
  private deviceService = inject(DeviceService);

  readonly isLocalMuted$ = new BehaviorSubject<boolean>(false);
  readonly isLocalVideoOn$ = new BehaviorSubject<boolean>(false);
  readonly isSharingScreen$ = new BehaviorSubject<boolean>(false);
  readonly layout$ = new BehaviorSubject<ParticipantLayout>('pip');

  readonly participants$ = this.chime.participants$.pipe(
    map((map) => Array.from(map.values()))
  );

  readonly remoteParticipants$ = this.chime.participants$.pipe(
    map((map) => Array.from(map.values()).filter((p) => !p.isLocal))
  );

  readonly localParticipant$ = this.chime.participants$.pipe(
    map((map) => Array.from(map.values()).find((p) => p.isLocal) ?? null)
  );

  readonly state$ = combineLatest([
    this.chime.meetingStatus$,
    this.isLocalMuted$,
    this.isLocalVideoOn$,
    this.isSharingScreen$,
    this.layout$,
    this.chime.activeSpeaker$,
    this.participants$,
    this.localParticipant$,
  ]).pipe(
    map(([status, isLocalMuted, isLocalVideoOn, isSharingScreen, layout, activeSpeakerId, participants, localParticipant]) => ({
      status,
      isLocalMuted,
      isLocalVideoOn,
      isSharingScreen,
      layout,
      activeSpeakerId,
      participants,
      localParticipant,
    } as MeetingState))
  );

  constructor() {
    // Auto-switch to screenshare layout when screen sharing starts;
    // revert to focused when it stops
    this.participants$.subscribe((participants) => {
      const hasScreenShare = participants.some((p) => p.isSharingScreen);
      const current = this.layout$.value;
      if (hasScreenShare && current !== 'screenshare') {
        this.layout$.next('screenshare');
      } else if (!hasScreenShare && current === 'screenshare') {
        this.layout$.next('focused');
      }
    });
  }

  get hasCameraSwitch(): boolean {
    return this.deviceService.hasMultipleCameras || this.deviceService.isMobileDevice;
  }

  async toggleMute(): Promise<void> {
    const muted = this.isLocalMuted$.value;
    if (muted) {
      await this.chime.unmuteLocalAudio();
    } else {
      await this.chime.muteLocalAudio();
    }
    this.isLocalMuted$.next(!muted);
  }

  async toggleVideo(): Promise<void> {
    const videoOn = this.isLocalVideoOn$.value;
    if (videoOn) {
      await this.chime.stopLocalVideo();
    } else {
      await this.chime.startLocalVideo();
    }
    this.isLocalVideoOn$.next(!videoOn);
  }

  async toggleScreenShare(): Promise<void> {
    const sharing = this.isSharingScreen$.value;
    if (sharing) {
      await this.chime.stopScreenShare();
    } else {
      await this.chime.startScreenShare();
    }
    this.isSharingScreen$.next(!sharing);
  }

  async switchCameraFacing(): Promise<void> {
    await this.deviceService.switchCameraFacing();
  }

  setLayout(layout: ParticipantLayout): void {
    this.layout$.next(layout);
  }
}
