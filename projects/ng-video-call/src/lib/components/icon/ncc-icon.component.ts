import {
  Component, Input, inject, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NCC_ICON_CONFIG, NccIconName, NccIconLibrary } from '../../models/icon.models';

const FA_MAP: Record<NccIconName, string> = {
  'mic': 'microphone', 'mic-off': 'microphone-slash',
  'video': 'video', 'video-off': 'video-slash',
  'camera-flip': 'camera-rotate', 'screen-share': 'desktop',
  'people': 'users', 'chat': 'comment',
  'leave': 'right-from-bracket', 'layout': 'table-cells',
  'close': 'xmark', 'emoji': 'face-smile',
  'send': 'paper-plane', 'sun': 'sun', 'moon': 'moon',
  'expand': 'expand', 'minimize': 'compress', 'phone-end': 'phone-slash',
};

const MI_MAP: Record<NccIconName, string> = {
  'mic': 'mic', 'mic-off': 'mic_off',
  'video': 'videocam', 'video-off': 'videocam_off',
  'camera-flip': 'flip_camera_ios', 'screen-share': 'screen_share',
  'people': 'people', 'chat': 'chat',
  'leave': 'logout', 'layout': 'dashboard',
  'close': 'close', 'emoji': 'emoji_emotions',
  'send': 'send', 'sun': 'light_mode', 'moon': 'dark_mode',
  'expand': 'open_in_full', 'minimize': 'close_fullscreen', 'phone-end': 'call_end',
};

const II_MAP: Record<NccIconName, string> = {
  'mic': 'mic-outline', 'mic-off': 'mic-off-outline',
  'video': 'videocam-outline', 'video-off': 'videocam-off-outline',
  'camera-flip': 'camera-reverse-outline', 'screen-share': 'desktop-outline',
  'people': 'people-outline', 'chat': 'chatbubble-outline',
  'leave': 'log-out-outline', 'layout': 'grid-outline',
  'close': 'close-outline', 'emoji': 'happy-outline',
  'send': 'send-outline', 'sun': 'sunny-outline', 'moon': 'moon-outline',
  'expand': 'expand-outline', 'minimize': 'contract-outline', 'phone-end': 'call-outline',
};

@Component({
  selector: 'ncc-icon',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0' },
  template: `
    <!-- Consumer HTML override wins regardless of library -->
    <span *ngIf="overrideHtml" [innerHTML]="overrideHtml"></span>

    <ng-container *ngIf="!overrideHtml">

      <!-- Font Awesome 6 Free/Pro -->
      <i *ngIf="library === 'font-awesome'"
         [class]="'fa-solid fa-' + faIcon"
         [style.fontSize.px]="size"></i>

      <!-- Google Material Icons (Symbols or legacy) -->
      <span *ngIf="library === 'material-icons'"
            class="material-icons"
            [style.fontSize.px]="size">{{ miIcon }}</span>

      <!-- Ionicons web components -->
      <ion-icon *ngIf="library === 'ionicons'"
                [name]="iiIcon"
                [style.fontSize.px]="size"></ion-icon>

      <!-- Built-in SVG icons (default) -->
      <ng-container *ngIf="library === 'default'">
        <ng-container [ngSwitch]="name">

          <svg *ngSwitchCase="'mic'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>

          <svg *ngSwitchCase="'mic-off'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
          </svg>

          <svg *ngSwitchCase="'video'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>

          <svg *ngSwitchCase="'video-off'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            <path d="M2 4.27l1.41-1.41 17 17-1.41 1.41z"/>
          </svg>

          <svg *ngSwitchCase="'camera-flip'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-.75-7.5v2l3.5-3.5-3.5-3.5v2c-2.76 0-5 2.24-5 5 0 1.22.44 2.33 1.16 3.19l1.46-1.46c-.37-.59-.62-1.28-.62-2.03 0-1.93 1.57-3.5 3.5-3.7z"/>
          </svg>

          <svg *ngSwitchCase="'screen-share'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78.48-4.34 1.71-5.5 3.72.14-3.44 2.07-6.3 5.5-7v-2l4 3.75-4 3.72z"/>
          </svg>

          <svg *ngSwitchCase="'people'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>

          <svg *ngSwitchCase="'chat'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>

          <svg *ngSwitchCase="'leave'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5z"/>
            <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>

          <svg *ngSwitchCase="'layout'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
          </svg>

          <svg *ngSwitchCase="'close'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>

          <svg *ngSwitchCase="'emoji'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>

          <svg *ngSwitchCase="'send'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>

          <svg *ngSwitchCase="'sun'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
          </svg>

          <svg *ngSwitchCase="'moon'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"/>
          </svg>

          <svg *ngSwitchCase="'expand'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>

          <svg *ngSwitchCase="'minimize'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>

          <svg *ngSwitchCase="'phone-end'" viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>

          <!-- Fallback for unknown icon names -->
          <svg *ngSwitchDefault viewBox="0 0 24 24" fill="currentColor" [attr.width]="size" [attr.height]="size">
            <circle cx="12" cy="12" r="10" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">?</text>
          </svg>

        </ng-container>
      </ng-container>
    </ng-container>
  `,
})
export class NccIconComponent {
  @Input({ required: true }) name!: NccIconName;
  @Input() size = 22;

  private config = inject(NCC_ICON_CONFIG, { optional: true });
  private sanitizer = inject(DomSanitizer);

  get library(): NccIconLibrary {
    return this.config?.library ?? 'default';
  }

  get overrideHtml(): SafeHtml | null {
    const raw = this.config?.overrides?.[this.name];
    return raw ? this.sanitizer.bypassSecurityTrustHtml(raw) : null;
  }

  get faIcon(): string { return FA_MAP[this.name] ?? this.name; }
  get miIcon(): string { return MI_MAP[this.name] ?? this.name; }
  get iiIcon(): string { return II_MAP[this.name] ?? this.name; }
}
