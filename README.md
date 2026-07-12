# ng-video-call

An enterprise-grade Angular communication library for video/audio conferencing, real-time chat, and screen sharing — built on **AWS Chime SDK** and published to NPM.

---

## Features

- Video & audio conferencing via AWS Chime SDK
- Real-time in-meeting chat with emoji support
- Screen sharing with automatic layout switching
- Floating draggable meeting window (persists across Angular routes)
- Dynamic layouts: `focused`, `grid`, `spotlight`, `screenshare`
- Active speaker detection & visual highlight
- Camera switching (front/rear on mobile)
- Dark / light / fully custom theming via CSS custom properties
- Configurable icon system: built-in SVGs, Font Awesome, Material Icons, Ionicons, or custom
- Configurable control bar labels (`showControlLabels`)
- Mobile-responsive, touch-optimised controls
- Standalone components — lazy-load friendly (no NgModule required)

---

## Installation

```bash
npm install ng-video-call
```

> **Peer dependencies** — ensure your project has these installed:
> ```bash
> npm install @angular/core @angular/common @angular/forms rxjs amazon-chime-sdk-js
> ```

---

## TypeScript Configuration

Add `"moduleResolution": "bundler"` (or `"node16"`) to your `tsconfig.json` to resolve the library correctly:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

---

## Module Setup

### Option A — NgModule (classic)

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { NgVideoCallModule } from 'ng-video-call';

@NgModule({
  imports: [
    NgVideoCallModule.forRoot({
      theme: { mode: 'dark' },
      icons: { library: 'default' }, // optional
    }),
  ],
})
export class AppModule {}
```

### Option B — Standalone (Angular 14+)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgVideoCall } from 'ng-video-call'; // see note below

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide services and config manually for standalone apps:
    ...NgVideoCallModule.forRoot({ theme: { mode: 'dark' } }).providers!,
  ],
};
```

Components are standalone and can be imported directly in any component:

```typescript
import { MeetingRoomComponent } from 'ng-video-call';

@Component({
  standalone: true,
  imports: [MeetingRoomComponent],
  ...
})
```

---

## Component Usage

### `<ncc-meeting-room>` — Full Meeting Room

The main component. Handles connection, video grid, controls, chat, and participants.

```html
<ncc-meeting-room
  [meetingConfig]="meetingConfig"
  [meetingOptions]="meetingOptions"
  [theme]="theme"
  [showHeader]="true"
  [logoUrl]="'/assets/logo.png'"
  [brandName]="'My App'"
  [showControlLabels]="false"
  (meetingLeft)="onMeetingLeft()"
  (meetingFailed)="onError($event)">
</ncc-meeting-room>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `meetingConfig` | `MeetingConfig` | — | AWS Chime meeting + attendee credentials |
| `meetingOptions` | `MeetingOptions` | `{}` | Video quality, noise suppression, etc. |
| `theme` | `ThemeConfig` | — | Override theme at component level |
| `showHeader` | `boolean` | `true` | Show meeting header bar |
| `logoUrl` | `string` | — | URL for brand logo in header |
| `brandName` | `string` | `'Meeting'` | Brand name in header |
| `demoMode` | `boolean` | `false` | Run with simulated participants (no backend) |
| `demoParticipantCount` | `number` | `3` | Number of simulated participants |
| `showControlLabels` | `boolean` | `false` | Show text labels beneath control buttons |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `meetingLeft` | `void` | Fired when the user leaves the meeting |
| `meetingFailed` | `Error` | Fired when connection fails |

---

### `<ncc-join-screen>` — Join Form

A pre-built join form collecting meeting credentials.

```html
<ncc-join-screen
  [showDemoButton]="true"
  (join)="handleJoin($event)"
  (tryDemo)="launchDemo()">
</ncc-join-screen>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `showDemoButton` | `boolean` | `false` | Show a "Launch Demo" button below the form |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `join` | `MeetingConfig & { name, startWithVideoOn, startMuted }` | Emitted on form submit |
| `tryDemo` | `void` | Emitted when Demo button is clicked |

---

### `<ncc-floating-meeting>` — Floating Overlay

A draggable mini meeting card that floats over your app and expands to full-screen. Managed via `MeetingOverlayService`.

```typescript
// Inject and start the overlay from anywhere in your app
import { MeetingOverlayService } from 'ng-video-call';

constructor(private overlay: MeetingOverlayService) {}

startFloating(): void {
  this.overlay.open({
    meetingConfig: this.meetingConfig,
    brandName: 'My App',
  });
}
```

Place the component once at the root of your app (e.g., `app.component.html`):

```html
<router-outlet></router-outlet>
<ncc-floating-meeting></ncc-floating-meeting>
```

---

### `<ncc-video-tile>` — Single Participant Tile

Renders one participant's video (or avatar) with status badges.

```html
<ncc-video-tile [participant]="participant"></ncc-video-tile>
```

#### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `participant` | `Participant` | Yes | Participant data object |

---

### `<ncc-meeting-controls>` — Control Bar

The bottom control toolbar. Usually embedded inside `<ncc-meeting-room>`, but can be used standalone for custom layouts.

```html
<ncc-meeting-controls
  [isMuted]="isMuted"
  [isVideoOn]="isVideoOn"
  [showControlLabels]="true"
  (toggleMute)="toggleMute()"
  (toggleVideo)="toggleVideo()"
  (leaveMeeting)="leave()">
</ncc-meeting-controls>
```

---

## Routing Example

A typical pattern: show the join screen, then navigate into the meeting.

```typescript
// meeting-page.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MeetingConfig } from 'ng-video-call';

@Component({
  standalone: true,
  imports: [JoinScreenComponent, MeetingRoomComponent, CommonModule],
  template: `
    <ncc-join-screen
      *ngIf="!inMeeting"
      [showDemoButton]="true"
      (join)="startMeeting($event)"
      (tryDemo)="startDemo()">
    </ncc-join-screen>

    <ncc-meeting-room
      *ngIf="inMeeting"
      [meetingConfig]="meetingConfig"
      [showControlLabels]="false"
      (meetingLeft)="onLeft()">
    </ncc-meeting-room>
  `,
})
export class MeetingPageComponent {
  inMeeting = false;
  meetingConfig!: MeetingConfig;

  startMeeting(config: MeetingConfig & { name: string }): void {
    this.meetingConfig = config;
    this.inMeeting = true;
  }

  startDemo(): void {
    this.inMeeting = true; // uses demoMode on ncc-meeting-room
  }

  onLeft(): void {
    this.inMeeting = false;
  }
}
```

Route definition:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'meeting',
    loadComponent: () =>
      import('./meeting-page/meeting-page.component').then(m => m.MeetingPageComponent),
  },
];
```

---

## Meeting Configuration

```typescript
export interface MeetingConfig {
  meetingId: string;         // AWS Chime meeting ID
  externalMeetingId?: string;
  attendeeId: string;        // AWS Chime attendee ID
  externalUserId?: string;   // Display name / your app user ID
  joinToken: string;         // AWS Chime join token
  mediaRegion?: string;      // e.g. 'us-east-1'
  endpoint?: string;         // Custom Chime endpoint (optional)
}

export interface MeetingOptions {
  videoQuality?: 'low' | 'medium' | 'high' | 'hd'; // default: 'high'
  enableNoiseSuppression?: boolean;                  // default: true
  enableEchoCancellation?: boolean;                  // default: true
  simulcastEnabled?: boolean;                        // default: false
  maxVideoTiles?: number;                            // default: 16
}
```

---

## Theming

### Built-in themes

| Mode | Description |
|------|-------------|
| `'dark'` | Dark background with muted borders (default) |
| `'light'` | Light background |
| `'custom'` | Provide your own `colors`, `typography`, `spacing` |

### Apply a theme globally

```typescript
NgVideoCallModule.forRoot({
  theme: {
    mode: 'dark',
    colors: {
      primary: '#6366f1',       // your brand colour
      primaryForeground: '#fff',
    },
    borderRadius: '10px',
  },
})
```

### Apply a theme per-component

```html
<ncc-meeting-room [theme]="{ mode: 'light', colors: { primary: '#0ea5e9' } }">
</ncc-meeting-room>
```

### CSS Custom Properties

You can override any design token in your global stylesheet:

```css
:root {
  --ncc-primary: #6366f1;
  --ncc-primary-fg: #ffffff;
  --ncc-bg: #0f172a;
  --ncc-surface: #1e293b;
  --ncc-surface-elevated: #334155;
  --ncc-text: #f1f5f9;
  --ncc-text-muted: #94a3b8;
  --ncc-border: #334155;
  --ncc-danger: #ef4444;
  --ncc-success: #22c55e;
  --ncc-warning: #f59e0b;
  --ncc-font-family: 'Inter', sans-serif;
  --ncc-font-size-base: 14px;
  --ncc-border-radius: 8px;
}
```

---

## Icon System

The library ships with clean built-in SVG icons. You can swap them for any popular icon library with a single config option.

### Default (built-in SVGs)

No extra setup required. Used automatically when no `icons` config is provided.

### Font Awesome 6

1. Add Font Awesome to your project:
   ```html
   <!-- index.html -->
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
   ```

2. Configure the library:
   ```typescript
   NgVideoCallModule.forRoot({
     icons: { library: 'font-awesome' },
   })
   ```

### Google Material Icons

1. Add Material Icons to your project:
   ```html
   <!-- index.html -->
   <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
   ```

2. Configure:
   ```typescript
   NgVideoCallModule.forRoot({
     icons: { library: 'material-icons' },
   })
   ```

### Ionicons

1. Add Ionicons scripts to your `index.html`:
   ```html
   <script type="module" src="https://unpkg.com/ionicons@7/dist/ionicons/ionicons.esm.js"></script>
   <script nomodule src="https://unpkg.com/ionicons@7/dist/ionicons/ionicons.js"></script>
   ```

2. Configure:
   ```typescript
   NgVideoCallModule.forRoot({
     icons: { library: 'ionicons' },
   })
   ```

### Per-icon HTML overrides

Override individual icons with raw HTML regardless of the chosen library. Useful for mixing custom SVGs with a font library, or for brand-specific icons:

```typescript
NgVideoCallModule.forRoot({
  icons: {
    library: 'font-awesome',
    overrides: {
      // Replace the leave button with a custom inline SVG
      'leave': '<svg viewBox="0 0 24 24" width="22" height="22">...</svg>',
    },
  },
})
```

> Only provide trusted HTML in `overrides`. The strings are injected as `innerHTML`.

### Standalone app icon config

Without `NgVideoCallModule`, provide the token directly:

```typescript
// app.config.ts
import { NCC_ICON_CONFIG } from 'ng-video-call';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NCC_ICON_CONFIG, useValue: { library: 'material-icons' } },
  ],
};
```

### Available icon names

| Name | Used for |
|------|----------|
| `mic` | Microphone on |
| `mic-off` | Microphone muted |
| `video` | Camera on |
| `video-off` | Camera off |
| `camera-flip` | Switch front/rear camera |
| `screen-share` | Share screen |
| `people` | Participants list |
| `chat` | Chat panel |
| `leave` | Leave meeting |
| `layout` | Switch participant layout |
| `close` | Close/dismiss panels |
| `emoji` | Emoji picker toggle |
| `send` | Send message |
| `sun` | Light mode toggle |
| `moon` | Dark mode toggle |
| `expand` | Expand floating window |
| `minimize` | Minimize floating window |
| `phone-end` | End call |

---

## Control Labels

By default the control bar shows icons only. Enable text labels with `showControlLabels`:

```html
<!-- Icons only (default) -->
<ncc-meeting-room [showControlLabels]="false"></ncc-meeting-room>

<!-- Icons + labels -->
<ncc-meeting-room [showControlLabels]="true"></ncc-meeting-room>
```

Labels are always hidden on mobile screens (≤ 540 px) regardless of this setting, to preserve space.

---

## Layouts

| Layout | Description |
|--------|-------------|
| `'focused'` | Large active speaker tile + horizontal strip of others |
| `'grid'` | Equal-size tiles in a responsive grid |
| `'spotlight'` | Large speaker + vertical sidebar strip |
| `'screenshare'` | Shared screen fills the stage + bottom strip |

The layout switcher in the control bar cycles through all four. The `screenshare` layout activates automatically when someone shares their screen.

---

## Services

All services are provided via `NgVideoCallModule.forRoot()` or injected manually.

### `MeetingStateService`

Reactive state source for the meeting.

```typescript
import { MeetingStateService } from 'ng-video-call';

constructor(private meetingState: MeetingStateService) {}

// Observable stream of full meeting state
this.meetingState.state$.subscribe(state => {
  console.log(state.participants, state.layout, state.isLocalMuted);
});

// Imperative controls
this.meetingState.toggleMute();
this.meetingState.toggleVideo();
this.meetingState.toggleScreenShare();
this.meetingState.setLayout('grid');
```

### `ChimeService`

Low-level AWS Chime SDK wrapper.

```typescript
import { ChimeService } from 'ng-video-call';

await this.chime.joinMeeting(meetingConfig, meetingOptions);
await this.chime.leaveMeeting();
```

### `ChatService`

In-meeting chat state.

```typescript
import { ChatService } from 'ng-video-call';

this.chatService.chatState$.subscribe(state => {
  console.log(state.messages, state.unreadCount);
});

this.chatService.sendMessage(attendeeId, displayName, 'Hello!');
this.chatService.toggleChat();
```

### `ThemeService`

Apply or switch themes at runtime.

```typescript
import { ThemeService } from 'ng-video-call';

this.themeService.apply({ mode: 'light' });
this.themeService.toggleMode(); // dark ↔ light
```

### `MeetingOverlayService`

Manages the floating meeting overlay across routes.

```typescript
import { MeetingOverlayService } from 'ng-video-call';

this.overlay.open({ meetingConfig, brandName: 'My App' });
this.overlay.close();
```

---

## Styling Overrides

All library classes are prefixed with `ncc-`. You can override specific styles in your global `styles.scss`:

```scss
// Increase control bar height
ncc-meeting-controls .ncc-controls {
  height: 80px;
}

// Change button border radius
ncc-meeting-controls .ncc-ctrl--round {
  border-radius: 10px;
}

// Widen the sidebar
ncc-meeting-room .ncc-room__sidebar {
  width: 320px;
}
```

> **Note:** Angular's view encapsulation is disabled for library styles. Use the `ncc-` prefix to avoid collisions.

---

## Troubleshooting

### Camera / microphone not working

Ensure your app is served over **HTTPS** (or `localhost`). Browsers block device access on insecure origins.

Check that the browser has been granted camera/mic permissions. You can guide users to **Settings → Site permissions**.

### Black video tiles

The video tile renders black if the AWS Chime tile binding hasn't fired yet. Verify that `joinToken` and `attendeeId` are correct, and that the Chime meeting is active.

### `NullInjectorError: NCC_ICON_CONFIG`

This is a warning, not a hard error — the icon component falls back to built-in SVGs when the token is absent. If you see it as a hard error, ensure `NgVideoCallModule.forRoot()` (or the manual token provider) is in the root injector.

### Module resolution errors

Add `"moduleResolution": "bundler"` to `tsconfig.json`. See [TypeScript Configuration](#typescript-configuration).

### Zone.js conflicts

If using `zone.js` 0.15+, import `zone.js/plugins/zone-patch-rxjs` in `polyfills.ts`:

```typescript
import 'zone.js';
import 'zone.js/plugins/zone-patch-rxjs';
```

---

## Workspace Structure

```
ng-video-call-workspace/
  projects/
    ng-video-call/          ← library source
      src/lib/
        components/         ← all UI components
        services/           ← ChimeService, MeetingStateService, etc.
        models/             ← TypeScript interfaces
    ng-video-call-demo/     ← demo application
  angular.json
  package.json
  tsconfig.json
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Serve the demo app at `localhost:4200` |
| `npm run build` | Build the library |
| `npm run build:demo` | Build the demo app |
| `npm run build:lib:prod` | Production build of the library |
| `npm run watch` | Watch build (development) |
| `npm run publish:lib` | Production build + `npm publish` |

---

## Stack

- Angular 21, TypeScript 5.9, RxJS 7
- AWS Chime SDK (`amazon-chime-sdk-js` 3.x)
- WebRTC
- SCSS + CSS custom properties
- Angular CDK (floating overlay)

---

## License

MIT
