export interface Participant {
  attendeeId: string;
  externalUserId: string;
  name: string;
  avatarUrl?: string;
  isLocal: boolean;
  isHost: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isSharingScreen: boolean;
  audioVolume: number;
  isActiveSpeaker: boolean;
  tileId?: number;
  signalStrength?: number;
}

export type ParticipantLayout = 'focused' | 'grid' | 'spotlight' | 'screenshare' | 'pip';
