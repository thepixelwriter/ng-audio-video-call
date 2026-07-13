# ng-audio-video-call

Enterprise-grade Angular communication SDK with video conferencing, audio, real-time chat, and screen sharing — powered by AWS Chime SDK.

Inspired by Zoom, Google Meet, and Microsoft Teams. Mobile-responsive, themeable, and AR/VR-ready.

---

## Installation

```bash
npm install ng-audio-video-call amazon-chime-sdk-js
```

---

## Quick Start

### 1. Import the module

```typescript
// app.config.ts (standalone)
import { NgVideoCallModule } from 'ng-audio-video-call';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(NgVideoCallModule.forRoot()),
  ],
};
```

### 2. Use the components

```html
<!-- Join screen -->
<ncc-join-screen (join)="onJoin($event)"></ncc-join-screen>

<!-- Full meeting room -->
<ncc-meeting-room
  [meetingConfig]="config"
  [theme]="{ mode: 'dark' }"
  [brandName]="'My App'"
  (meetingLeft)="onLeft()"
  (meetingFailed)="onFailed($event)">
</ncc-meeting-room>
```

```typescript
import { MeetingConfig } from 'ng-audio-video-call';

onJoin(data: MeetingConfig) {
  this.config = {
    meetingId: data.meetingId,
    attendeeId: data.attendeeId,
    joinToken: data.joinToken,
  };
}
```

---

## Components

| Component | Selector | Description |
|-----------|----------|-------------|
| `MeetingRoomComponent` | `<ncc-meeting-room>` | Full meeting UI (grid + controls + chat + sidebar) |
| `JoinScreenComponent` | `<ncc-join-screen>` | Pre-join form with device/theme config |
| `VideoTileComponent` | `<ncc-video-tile>` | Single participant video tile |
| `ParticipantGridComponent` | `<ncc-participant-grid>` | Responsive participant grid |
| `MeetingControlsComponent` | `<ncc-meeting-controls>` | Bottom control toolbar |
| `ChatPanelComponent` | `<ncc-chat-panel>` | Slide-in chat panel |
| `ParticipantListComponent` | `<ncc-participant-list>` | Sidebar participant roster |

---

## MeetingRoomComponent Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `meetingConfig` | `MeetingConfig` | — | AWS Chime meeting credentials |
| `meetingOptions` | `MeetingOptions` | `{}` | Video quality, noise suppression, etc. |
| `theme` | `ThemeConfig` | dark | Theme configuration |
| `showHeader` | `boolean` | `true` | Show/hide top header bar |
| `brandName` | `string` | `'Meeting'` | Brand name in header |
| `logoUrl` | `string` | — | Logo URL in header |

### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `meetingLeft` | `void` | User clicked Leave |
| `meetingFailed` | `Error` | Connection failed |

---

## Theming

```typescript
import { ThemeService, ThemeConfig } from 'ng-audio-video-call';

// Dark theme (default)
themeService.apply({ mode: 'dark' });

// Light theme
themeService.apply({ mode: 'light' });

// Custom branded theme
themeService.apply({
  mode: 'custom',
  colors: {
    primary: '#7c3aed',
    primaryForeground: '#ffffff',
    background: '#0d0d0d',
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
  borderRadius: '12px',
  brandName: 'My Platform',
  logoUrl: '/assets/logo.svg',
});

// Toggle dark/light
themeService.toggleMode();
```

All theme values are applied as CSS custom properties (`--ncc-*`) on `<html>`.

---

## Services

### `ChimeService`
Low-level AWS Chime SDK wrapper.

```typescript
import { ChimeService } from 'ng-audio-video-call';

// Join
await chime.joinMeeting(config, options);

// Media controls
await chime.muteLocalAudio();
await chime.unmuteLocalAudio();
await chime.startLocalVideo();
await chime.stopLocalVideo();
await chime.startScreenShare();
await chime.stopScreenShare();

// Observables
chime.meetingStatus$   // BehaviorSubject<MeetingStatus>
chime.participants$    // BehaviorSubject<Map<string, Participant>>
chime.activeSpeaker$  // BehaviorSubject<string | null>
```

### `MeetingStateService`
Higher-level state + toggle helpers.

```typescript
import { MeetingStateService } from 'ng-audio-video-call';

meetingState.state$           // Observable<MeetingState>
meetingState.toggleMute()
meetingState.toggleVideo()
meetingState.toggleScreenShare()
meetingState.setLayout('spotlight' | 'grid' | 'sidebar')
```

### `ChatService`
In-meeting chat state management.

```typescript
import { ChatService } from 'ng-audio-video-call';

chat.sendMessage(senderId, senderName, content);
chat.receiveMessage(senderId, senderName, content); // for incoming via data messages
chat.toggleChat();
chat.chatState$  // BehaviorSubject<ChatState>
```

### `ThemeService`
Runtime theme engine.

### `DeviceService`
Audio/video device enumeration and selection.

---

## Layout Modes

| Mode | Description |
|------|-------------|
| `grid` | Equal tiles, responsive columns |
| `spotlight` | Active speaker large + sidebar strip |
| `sidebar` | (future) side-by-side |

---

## MeetingConfig Interface

```typescript
interface MeetingConfig {
  meetingId: string;
  externalMeetingId?: string;
  attendeeId: string;
  externalUserId?: string;
  joinToken: string;
  mediaRegion?: string;
  endpoint?: string;
}
```

---

## CSS Custom Properties

| Variable | Default (dark) | Description |
|----------|----------------|-------------|
| `--ncc-primary` | `#4f80ff` | Brand/action color |
| `--ncc-bg` | `#0f1117` | Page background |
| `--ncc-surface` | `#1a1d2e` | Component surface |
| `--ncc-text` | `#f0f2f5` | Primary text |
| `--ncc-text-muted` | `#8892a4` | Secondary text |
| `--ncc-border` | `#2d3748` | Borders |
| `--ncc-danger` | `#f56565` | Danger/error |
| `--ncc-success` | `#48bb78` | Success/active |
| `--ncc-font-family` | `Inter, system-ui` | Font stack |
| `--ncc-border-radius` | `8px` | Corner radius |

---

## Development

```bash
# Clone and install
git clone <repo>
npm install

# Watch-build the library
npm run watch

# Run the demo app
npm run start:demo

# Build for production
npm run build:lib:prod

# Publish to NPM
npm run publish:lib
```

---

## Future Roadmap

- **AR**: WebXR measurement, ARCore/ARKit, TensorFlow.js object detection
- **VR**: Meta Quest / Apple Vision Pro / WebXR immersive meeting rooms
- **Noise suppression**: Amazon Voice Focus integration
- **Breakout rooms**: Sub-meeting management
- **Recording**: Server-side recording hooks
- **Reactions**: Live emoji reactions
- **Whiteboard**: Collaborative canvas

---

## License

MIT
