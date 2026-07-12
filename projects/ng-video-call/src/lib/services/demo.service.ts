import { Injectable, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { MeetingStateService } from './meeting-state.service';
import { ChimeService } from './chime.service';
import { Participant } from '../models/participant.models';

const DEMO_NAMES = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Emma Davis'];

@Injectable({ providedIn: 'root' })
export class DemoService {
  private chime = inject(ChimeService);
  private meetingState = inject(MeetingStateService);
  private simulationSub?: Subscription;

  startDemo(participantCount = 3, displayName = 'Me'): void {
    this.chime.meetingStatus$.next('connected');

    const participants = new Map<string, Participant>();
    const localName = displayName.trim() || 'Me';

    participants.set('local-001', {
      attendeeId: 'local-001',
      externalUserId: localName,
      name: localName,
      isLocal: true,
      isHost: true,
      isMuted: false,
      isVideoOn: false,
      isSharingScreen: false,
      audioVolume: 0,
      isActiveSpeaker: false,
    });

    const count = Math.min(participantCount, DEMO_NAMES.length);
    for (let i = 0; i < count; i++) {
      const id = `remote-00${i + 1}`;
      participants.set(id, {
        attendeeId: id,
        externalUserId: DEMO_NAMES[i],
        name: DEMO_NAMES[i],
        isLocal: false,
        isHost: i === 0,
        isMuted: i % 3 === 0,
        isVideoOn: false,
        isSharingScreen: false,
        audioVolume: 0,
        isActiveSpeaker: false,
      });
    }

    this.chime.participants$.next(participants);

    let tick = 0;
    const ids = Array.from(participants.keys()).filter((id) => id !== 'local-001');
    this.simulationSub = interval(2500).subscribe(() => {
      tick++;
      const map = new Map(this.chime.participants$.value);
      const speakerId = ids[tick % ids.length];

      map.forEach((p, id) => {
        const isSpeaker = id === speakerId;
        map.set(id, {
          ...p,
          isActiveSpeaker: isSpeaker,
          audioVolume: isSpeaker ? 0.6 + Math.random() * 0.4 : 0,
          isMuted: p.isMuted,
        });
      });

      this.chime.participants$.next(map);
      this.chime.activeSpeaker$.next(speakerId);
    });
  }

  stopDemo(): void {
    this.simulationSub?.unsubscribe();
    this.chime.meetingStatus$.next('disconnected');
    this.chime.participants$.next(new Map());
  }
}
