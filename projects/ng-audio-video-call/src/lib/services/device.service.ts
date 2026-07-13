import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { DeviceState, PermissionState } from '../models/device.models';
import { ChimeService } from './chime.service';

const DEFAULT_STATE: DeviceState = {
  audioInputDevices: [],
  audioOutputDevices: [],
  videoInputDevices: [],
  selectedAudioInput: null,
  selectedAudioOutput: null,
  selectedVideoInput: null,
};

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private platformId = inject(PLATFORM_ID);
  private chime = inject(ChimeService);

  readonly deviceState$ = new BehaviorSubject<DeviceState>(DEFAULT_STATE);
  readonly permissions$ = new BehaviorSubject<PermissionState>({ camera: 'unknown', microphone: 'unknown' });
  readonly currentFacingMode$ = new BehaviorSubject<'user' | 'environment'>('user');
  readonly settingsToggle$ = new Subject<void>();

  get hasMultipleCameras(): boolean {
    return this.deviceState$.value.videoInputDevices.length > 1;
  }

  get isMobileDevice(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
  }

  async loadDevices(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const [audioIn, audioOut, videoIn] = await Promise.all([
      this.chime.listAudioInputDevices(),
      this.chime.listAudioOutputDevices(),
      this.chime.listVideoInputDevices(),
    ]);

    this.deviceState$.next({
      audioInputDevices: audioIn.map((d) => ({ deviceId: d.deviceId, label: d.label, kind: 'audioinput' })),
      audioOutputDevices: audioOut.map((d) => ({ deviceId: d.deviceId, label: d.label, kind: 'audiooutput' })),
      videoInputDevices: videoIn.map((d) => ({ deviceId: d.deviceId, label: d.label, kind: 'videoinput' })),
      selectedAudioInput: audioIn[0]?.deviceId ?? null,
      selectedAudioOutput: audioOut[0]?.deviceId ?? null,
      selectedVideoInput: videoIn[0]?.deviceId ?? null,
    });
  }

  async selectAudioInput(deviceId: string): Promise<void> {
    await this.chime.selectAudioInput(deviceId);
    const state = this.deviceState$.value;
    this.deviceState$.next({ ...state, selectedAudioInput: deviceId });
  }

  async selectAudioOutput(deviceId: string): Promise<void> {
    await this.chime.selectAudioOutput(deviceId);
    const state = this.deviceState$.value;
    this.deviceState$.next({ ...state, selectedAudioOutput: deviceId });
  }

  async selectVideoInput(deviceId: string): Promise<void> {
    await this.chime.selectVideoInput(deviceId);
    const state = this.deviceState$.value;
    this.deviceState$.next({ ...state, selectedVideoInput: deviceId });
  }

  /**
   * Toggle front/rear camera using facingMode constraints (mobile) or device list cycling (desktop).
   * Returns the new facing mode.
   */
  async switchCameraFacing(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const newMode = this.currentFacingMode$.value === 'user' ? 'environment' : 'user';

    try {
      // Mobile: use facingMode constraint — works on iOS Safari and Android Chrome
      await this.chime.selectVideoInput({ facingMode: { exact: newMode } });
      this.currentFacingMode$.next(newMode);
      const state = this.deviceState$.value;
      this.deviceState$.next({ ...state, selectedVideoInput: `__facing:${newMode}` });
    } catch {
      // Fallback for desktop or browsers that don't support facingMode:
      // cycle through known video devices by index
      const videos = this.deviceState$.value.videoInputDevices;
      if (videos.length < 2) return;

      const currentId = this.deviceState$.value.selectedVideoInput;
      const currentIdx = videos.findIndex((v) => v.deviceId === currentId);
      const nextIdx = (currentIdx + 1) % videos.length;
      await this.selectVideoInput(videos[nextIdx].deviceId);
      this.currentFacingMode$.next(newMode);
    }
  }

  async checkPermissions(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !navigator.permissions) return;
    try {
      const [cam, mic] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ]);
      this.permissions$.next({ camera: cam.state, microphone: mic.state });
    } catch {
      this.permissions$.next({ camera: 'unknown', microphone: 'unknown' });
    }
  }
}
