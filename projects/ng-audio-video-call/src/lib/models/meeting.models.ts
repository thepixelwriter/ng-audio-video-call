export interface MeetingConfig {
  meetingId: string;
  externalMeetingId?: string;
  attendeeId: string;
  externalUserId?: string;
  joinToken: string;
  mediaRegion?: string;
  endpoint?: string;
  signalingUrl?: string;
  audioFallbackUrl?: string;
  turnControlUrl?: string;
}

export interface AttendeeInfo {
  attendeeId: string;
  externalUserId: string;
  name?: string;
  avatarUrl?: string;
}

export interface MeetingSession {
  meetingId: string;
  attendeeId: string;
  isHost: boolean;
}

export type MeetingStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type VideoQuality = 'low' | 'medium' | 'high' | 'hd';

export interface MeetingOptions {
  videoQuality?: VideoQuality;
  enableNoiseSuppression?: boolean;
  enableEchoCancellation?: boolean;
  simulcastEnabled?: boolean;
  maxVideoTiles?: number;
  localUserName?: string;
}
