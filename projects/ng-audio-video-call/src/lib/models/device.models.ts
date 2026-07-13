export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

export interface DeviceState {
  audioInputDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  videoInputDevices: MediaDevice[];
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  selectedVideoInput: string | null;
}

export interface PermissionState {
  camera: PermissionStatus['state'] | 'unknown';
  microphone: PermissionStatus['state'] | 'unknown';
}
