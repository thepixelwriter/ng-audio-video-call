import { Injectable, OnDestroy, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject, Subscription, from, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  MeetingSessionConfiguration,
  DefaultMeetingSession,
  ConsoleLogger,
  LogLevel,
  DefaultDeviceController,
  MeetingSessionStatusCode,
  AudioVideoObserver,
  ContentShareObserver,
  VideoTile,
  DefaultActiveSpeakerPolicy,
} from 'amazon-chime-sdk-js';
import { MeetingConfig, MeetingStatus, MeetingOptions } from '../models/meeting.models';
import { Participant } from '../models/participant.models';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class ChimeService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private chatService = inject(ChatService);
  private meetingSession?: DefaultMeetingSession;
  private audioVideoObserver?: AudioVideoObserver;
  private contentShareObserver?: ContentShareObserver;
  private chatOutgoingSubscription?: Subscription;

  private static readonly CHAT_TOPIC = 'ncc-chat';

  readonly meetingStatus$ = new BehaviorSubject<MeetingStatus>('idle');
  readonly participants$ = new BehaviorSubject<Map<string, Participant>>(new Map());
  readonly activeSpeaker$ = new BehaviorSubject<string | null>(null);
  readonly videoTileUpdate$ = new Subject<{ tileId: number; attendeeId: string; active: boolean }>();
  readonly destroyed$ = new Subject<void>();

  private localAttendeeId = '';
  private localDisplayName = '';

  async joinMeeting(config: MeetingConfig, options: MeetingOptions = {}): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.meetingStatus$.next('connecting');

    try {
      const logger = new ConsoleLogger('NgVideoCall', LogLevel.WARN);
      const deviceController = new DefaultDeviceController(logger);

      const sessionConfig = new MeetingSessionConfiguration(
        {
          MeetingId: config.meetingId,
          ExternalMeetingId: config.externalMeetingId ?? config.meetingId,
          MediaPlacement: {
            AudioHostUrl: config.endpoint ?? '',
            AudioFallbackUrl: config.audioFallbackUrl ?? '',
            ScreenDataUrl: '',
            ScreenSharingUrl: '',
            ScreenViewingUrl: '',
            SignalingUrl: config.signalingUrl ?? '',
            TurnControlUrl: config.turnControlUrl ?? '',
            EventIngestionUrl: '',
          },
        },
        {
          AttendeeId: config.attendeeId,
          ExternalUserId: config.externalUserId ?? config.attendeeId,
          JoinToken: config.joinToken,
        }
      );

      this.meetingSession = new DefaultMeetingSession(sessionConfig, logger, deviceController);
      this.localAttendeeId = config.attendeeId;
      // Prefer explicit localUserName from options, then parse from externalUserId
      this.localDisplayName = options.localUserName
        ?? this.extractDisplayName(config.externalUserId ?? config.attendeeId);

      this.registerObservers();
      this.setupActiveSpeaker();

      await this.meetingSession.audioVideo.start();
      // Do not set 'connected' here — audioVideoDidStart fires when the
      // WebRTC peer connection is fully negotiated, which is the correct
      // signal that the session is ready for startAudioInput()
    } catch (err) {
      console.error('[NgVideoCall] Join meeting failed', err);
      this.meetingStatus$.next('failed');
      throw err;
    }
  }

  async leaveMeeting(): Promise<void> {
    if (!this.meetingSession) return;
    // Stop media tracks before stopping the session so the OS releases camera/mic
    try {
      this.meetingSession.audioVideo.stopLocalVideoTile();
      await this.meetingSession.audioVideo.stopVideoInput();
      await this.meetingSession.audioVideo.stopAudioInput();
    } catch { /* ignore — tracks may already be stopped */ }
    this.meetingSession.audioVideo.stop();
    this.meetingStatus$.next('disconnected');
    this.cleanup();
  }

  async startLocalVideo(): Promise<void> {
    if (!this.meetingSession) return;
    const videoInputs = await this.meetingSession.audioVideo.listVideoInputDevices();
    if (videoInputs.length > 0) {
      await this.meetingSession.audioVideo.startVideoInput(videoInputs[0].deviceId || 'default');
      this.meetingSession.audioVideo.startLocalVideoTile();
    }
  }

  async stopLocalVideo(): Promise<void> {
    if (!this.meetingSession) return;
    this.meetingSession.audioVideo.stopLocalVideoTile();
    await this.meetingSession.audioVideo.stopVideoInput();
  }

  async muteLocalAudio(): Promise<void> {
    this.meetingSession?.audioVideo.realtimeMuteLocalAudio();
  }

  async unmuteLocalAudio(): Promise<void> {
    this.meetingSession?.audioVideo.realtimeUnmuteLocalAudio();
  }

  async startScreenShare(): Promise<void> {
    if (!this.meetingSession) return;
    await this.meetingSession.audioVideo.startContentShareFromScreenCapture();
  }

  async stopScreenShare(): Promise<void> {
    await this.meetingSession?.audioVideo.stopContentShare();
  }

  async listAudioInputDevices() {
    return this.meetingSession?.audioVideo.listAudioInputDevices() ?? [];
  }

  async listAudioOutputDevices() {
    return this.meetingSession?.audioVideo.listAudioOutputDevices() ?? [];
  }

  async listVideoInputDevices() {
    return this.meetingSession?.audioVideo.listVideoInputDevices() ?? [];
  }

  async selectAudioInput(deviceId: string): Promise<void> {
    await this.meetingSession?.audioVideo.startAudioInput(deviceId);
  }

  async selectAudioOutput(deviceId: string): Promise<void> {
    await this.meetingSession?.audioVideo.chooseAudioOutput(deviceId);
  }

  async selectVideoInput(device: string | MediaTrackConstraints): Promise<void> {
    await this.meetingSession?.audioVideo.startVideoInput(device as string);
  }

  async bindVideoTile(tileId: number, element: HTMLVideoElement): Promise<void> {
    this.meetingSession?.audioVideo.bindVideoElement(tileId, element);
  }

  async bindAudioElement(element: HTMLAudioElement): Promise<void> {
    await this.meetingSession?.audioVideo.bindAudioElement(element);
  }

  get audioVideo() {
    return this.meetingSession?.audioVideo;
  }

  private registerObservers(): void {
    if (!this.meetingSession) return;

    this.audioVideoObserver = {
      audioVideoDidStart: () => {
        this.ngZone.run(() => this.meetingStatus$.next('connected'));
      },
      audioVideoDidStop: (sessionStatus) => {
        const code = sessionStatus.statusCode();
        this.ngZone.run(() => {
          if (code === MeetingSessionStatusCode.MeetingEnded) {
            this.meetingStatus$.next('disconnected');
          } else if (code !== MeetingSessionStatusCode.OK) {
            this.meetingStatus$.next('failed');
          }
        });
      },
      audioVideoDidStartConnecting: (reconnecting) => {
        if (reconnecting) this.ngZone.run(() => this.meetingStatus$.next('reconnecting'));
      },
      videoTileDidUpdate: (tileState) => {
        if (!tileState.tileId || !tileState.boundAttendeeId) return;
        // Skip content-share tiles — handled separately via contentShareDidStart/Stop
        if (tileState.isContent) return;
        const attendeeId = tileState.boundAttendeeId;
        const tileId = tileState.tileId;
        this.ngZone.run(() => {
          // Update state FIRST so VideoTileComponent.ngOnChanges has tileId set on first render
          this.updateParticipantTile(attendeeId, tileId);
          this.videoTileUpdate$.next({ tileId, attendeeId, active: true });
        });
      },
      videoTileWasRemoved: (tileId) => {
        this.ngZone.run(() => {
          this.videoTileUpdate$.next({ tileId, attendeeId: '', active: false });
          this.removeParticipantTile(tileId);
        });
      },
    };

    this.meetingSession.audioVideo.addObserver(this.audioVideoObserver!);

    this.contentShareObserver = {
      contentShareDidStart: () => {
        this.ngZone.run(() => this.setLocalSharingScreen(true));
      },
      contentShareDidStop: () => {
        this.ngZone.run(() => this.setLocalSharingScreen(false));
      },
    };
    this.meetingSession.audioVideo.addContentShareObserver(this.contentShareObserver);

    // externalUserId is the 3rd param — use it for clean display names
    this.meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      (attendeeId: string, present: boolean, externalUserId?: string) => {
        // Skip Chime's virtual content-share attendees (format: "realId#content")
        if (attendeeId.includes('#content')) return;
        this.ngZone.run(() => {
          if (present) this.addParticipant(attendeeId, externalUserId);
          else this.removeParticipant(attendeeId);
        });
      }
    );

    this.meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
      this.localAttendeeId,
      (attendeeId, volume, muted) => {
        this.ngZone.run(() => this.updateParticipantAudio(attendeeId, volume ?? 0, muted ?? false));
      }
    );

    // Receive chat messages from remote participants via Chime data messaging
    this.meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage(
      ChimeService.CHAT_TOPIC,
      (dataMessage) => {
        try {
          const payload = JSON.parse(new TextDecoder().decode(dataMessage.data));
          this.ngZone.run(() =>
            this.chatService.receiveMessage(
              dataMessage.senderAttendeeId,
              payload.senderName ?? dataMessage.senderExternalUserId ?? 'Unknown',
              payload.content,
            )
          );
        } catch { /* malformed message — ignore */ }
      }
    );

    // Forward outgoing chat messages from ChatService to Chime
    this.chatOutgoingSubscription = this.chatService.outgoingMessage$.subscribe(
      ({ senderName, content }) => this.sendChatMessage(senderName, content)
    );
  }

  private setupActiveSpeaker(): void {
    if (!this.meetingSession) return;
    this.meetingSession.audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      (attendeeIds) => {
        const speaker = attendeeIds[0] ?? null;
        this.ngZone.run(() => {
          this.activeSpeaker$.next(speaker);
          this.markActiveSpeaker(speaker);
        });
      }
    );
  }

  private addParticipant(attendeeId: string, externalUserId?: string): void {
    const map = new Map(this.participants$.value);
    if (!map.has(attendeeId)) {
      const isLocal = attendeeId === this.localAttendeeId;
      const rawName = isLocal
        ? this.localDisplayName
        : this.extractDisplayName(externalUserId ?? attendeeId);
      map.set(attendeeId, {
        attendeeId,
        externalUserId: externalUserId ?? attendeeId,
        name: rawName,
        isLocal,
        isHost: false,
        isMuted: false,
        isVideoOn: false,
        isSharingScreen: false,
        audioVolume: 0,
        isActiveSpeaker: false,
      });
      this.participants$.next(map);
    }
  }

  private removeParticipant(attendeeId: string): void {
    const map = new Map(this.participants$.value);
    map.delete(attendeeId);
    this.participants$.next(map);
  }

  private updateParticipantAudio(attendeeId: string, volume: number, muted: boolean): void {
    const map = new Map(this.participants$.value);
    const p = map.get(attendeeId);
    if (p) {
      map.set(attendeeId, { ...p, audioVolume: volume, isMuted: muted });
      this.participants$.next(map);
    }
  }

  private updateParticipantTile(attendeeId: string, tileId: number): void {
    if (!this.participants$.value.has(attendeeId)) { this.addParticipant(attendeeId); }
    const map = new Map(this.participants$.value);
    const p = map.get(attendeeId);
    if (p) {
      map.set(attendeeId, { ...p, tileId, isVideoOn: true });
      this.participants$.next(map);
    }
  }

  private removeParticipantTile(tileId: number): void {
    const map = new Map(this.participants$.value);
    map.forEach((p, id) => {
      if (p.tileId === tileId) {
        map.set(id, { ...p, tileId: undefined, isVideoOn: false });
      }
    });
    this.participants$.next(map);
  }

  private markActiveSpeaker(attendeeId: string | null): void {
    const map = new Map(this.participants$.value);
    map.forEach((p, id) => {
      map.set(id, { ...p, isActiveSpeaker: id === attendeeId });
    });
    this.participants$.next(map);
  }

  private setLocalSharingScreen(value: boolean): void {
    const map = new Map(this.participants$.value);
    const local = Array.from(map.values()).find(p => p.isLocal);
    if (local) {
      map.set(local.attendeeId, { ...local, isSharingScreen: value });
      this.participants$.next(map);
    }
  }

  // Strips the trailing "-UUID" appended by the Lambda: "Name-b45f95ec-7fd7-40fc-9ce6-34ec51d26c65"
  private extractDisplayName(externalUserId: string): string {
    const cleaned = externalUserId.replace(
      /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ''
    );
    return cleaned || externalUserId;
  }

  private sendChatMessage(senderName: string, content: string): void {
    if (!this.meetingSession) return;
    try {
      const payload = JSON.stringify({ senderName, content });
      this.meetingSession.audioVideo.realtimeSendDataMessage(
        ChimeService.CHAT_TOPIC,
        payload,
        30_000,
      );
    } catch { /* session may have ended */ }
  }

  private cleanup(): void {
    this.chatOutgoingSubscription?.unsubscribe();
    if (this.meetingSession) {
      if (this.audioVideoObserver) {
        this.meetingSession.audioVideo.removeObserver(this.audioVideoObserver);
      }
      if (this.contentShareObserver) {
        this.meetingSession.audioVideo.removeContentShareObserver(this.contentShareObserver);
      }
      this.meetingSession.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(
        ChimeService.CHAT_TOPIC
      );
    }
    this.meetingSession = undefined;
    this.participants$.next(new Map());
  }

  ngOnDestroy(): void {
    this.leaveMeeting();
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
