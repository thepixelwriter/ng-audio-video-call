import { InjectionToken } from '@angular/core';

export type NccIconName =
  | 'mic' | 'mic-off'
  | 'video' | 'video-off'
  | 'camera-flip'
  | 'screen-share'
  | 'people'
  | 'chat'
  | 'leave'
  | 'layout'
  | 'close'
  | 'emoji'
  | 'send'
  | 'sun'
  | 'moon'
  | 'expand'
  | 'minimize'
  | 'phone-end';

export type NccIconLibrary = 'default' | 'font-awesome' | 'material-icons' | 'ionicons';

export interface NccIconConfig {
  /** Icon library to use. Defaults to 'default' (built-in SVGs). */
  library?: NccIconLibrary;
  /**
   * Per-icon HTML overrides rendered as innerHTML.
   * Only provide trusted HTML. Overrides apply regardless of chosen library.
   */
  overrides?: Partial<Record<NccIconName, string>>;
}

export const NCC_ICON_CONFIG = new InjectionToken<NccIconConfig>('NCC_ICON_CONFIG');
