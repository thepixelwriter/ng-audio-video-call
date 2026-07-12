import { NgModule, ModuleWithProviders, InjectionToken, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MeetingRoomComponent } from './components/meeting-room/meeting-room.component';
import { JoinScreenComponent } from './components/join-screen/join-screen.component';
import { VideoTileComponent } from './components/video-tile/video-tile.component';
import { ParticipantGridComponent } from './components/participant-grid/participant-grid.component';
import { MeetingControlsComponent } from './components/meeting-controls/meeting-controls.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { ParticipantListComponent } from './components/participant-list/participant-list.component';
import { FloatingMeetingComponent } from './components/floating-meeting/floating-meeting.component';
import { NccIconComponent } from './components/icon/ncc-icon.component';

import { ChimeService } from './services/chime.service';
import { MeetingStateService } from './services/meeting-state.service';
import { MeetingSessionService } from './services/meeting-session.service';
import { MeetingOverlayService } from './services/meeting-overlay.service';
import { ChatService } from './services/chat.service';
import { DeviceService } from './services/device.service';
import { ThemeService } from './services/theme.service';

import { ThemeConfig } from './models/theme.models';
import { NccIconConfig, NCC_ICON_CONFIG } from './models/icon.models';

export interface NgVideoCallConfig {
  theme?: ThemeConfig;
  /** Configure the icon system. Defaults to built-in SVG icons. */
  icons?: NccIconConfig;
}

export const NG_VIDEO_CALL_CONFIG = new InjectionToken<NgVideoCallConfig>('NG_VIDEO_CALL_CONFIG');

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MeetingRoomComponent,
    JoinScreenComponent,
    VideoTileComponent,
    ParticipantGridComponent,
    MeetingControlsComponent,
    ChatPanelComponent,
    ParticipantListComponent,
    FloatingMeetingComponent,
    NccIconComponent,
  ],
  exports: [
    MeetingRoomComponent,
    JoinScreenComponent,
    VideoTileComponent,
    ParticipantGridComponent,
    MeetingControlsComponent,
    ChatPanelComponent,
    ParticipantListComponent,
    FloatingMeetingComponent,
    NccIconComponent,
  ],
})
export class NgVideoCallModule {
  static forRoot(config?: NgVideoCallConfig): ModuleWithProviders<NgVideoCallModule> {
    return {
      ngModule: NgVideoCallModule,
      providers: [
        ChimeService,
        MeetingStateService,
        MeetingSessionService,
        MeetingOverlayService,
        ChatService,
        DeviceService,
        ThemeService,
        { provide: NG_VIDEO_CALL_CONFIG, useValue: config ?? {} },
        {
          provide: NCC_ICON_CONFIG,
          useFactory: (cfg: NgVideoCallConfig) => cfg?.icons ?? {},
          deps: [NG_VIDEO_CALL_CONFIG],
        },
        {
          provide: APP_INITIALIZER,
          useFactory: (theme: ThemeService, cfg: NgVideoCallConfig) => () => {
            if (cfg?.theme) theme.apply(cfg.theme);
          },
          deps: [ThemeService, NG_VIDEO_CALL_CONFIG],
          multi: true,
        },
      ],
    };
  }
}
