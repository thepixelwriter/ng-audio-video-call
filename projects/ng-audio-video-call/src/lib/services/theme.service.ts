import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ThemeConfig, ThemeColors, ThemeMode } from '../models/theme.models';

const DEFAULT_PRIMARY = '#D42222';

const DARK_COLORS: ThemeColors = {
  primary:            DEFAULT_PRIMARY,
  primaryForeground:  '#ffffff',
  secondary:          '#0C1A35',
  secondaryForeground:'#C5D3EE',
  background:         '#040F25',
  surface:            '#091528',
  surfaceElevated:    '#0F2040',
  text:               '#EEF2FA',
  textMuted:          '#7B8FAF',
  border:             '#182D52',
  danger:             '#ef4444',
  success:            '#22c55e',
  warning:            '#f59e0b',
};

const LIGHT_COLORS: ThemeColors = {
  primary:            DEFAULT_PRIMARY,
  primaryForeground:  '#ffffff',
  secondary:          '#EEF2FA',
  secondaryForeground:'#040F25',
  background:         '#F1F5FD',
  surface:            '#FFFFFF',
  surfaceElevated:    '#E8EEF8',
  text:               '#040F25',
  textMuted:          '#576580',
  border:             '#D8E0F0',
  danger:             '#dc2626',
  success:            '#16a34a',
  warning:            '#d97706',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  readonly currentTheme$ = new BehaviorSubject<ThemeConfig>({ mode: 'light' });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.apply({ mode: 'light' });
    }
  }

  apply(config: ThemeConfig): void {
    this.currentTheme$.next(config);
    if (!isPlatformBrowser(this.platformId)) return;

    const root = document.documentElement;
    const base = config.mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
    const colors: ThemeColors = { ...base, ...(config.colors ?? {}) };

    this.setCssVars(root, colors, config);
  }

  setMode(mode: ThemeMode): void {
    this.apply({ ...this.currentTheme$.value, mode });
  }

  toggleMode(): void {
    const current = this.currentTheme$.value.mode;
    this.setMode(current === 'dark' ? 'light' : 'dark');
  }

  get currentMode(): ThemeMode {
    return this.currentTheme$.value.mode;
  }

  private setCssVars(root: HTMLElement, colors: ThemeColors, config: ThemeConfig): void {
    const vars: Record<string, string> = {
      '--ncc-primary':           colors.primary,
      '--ncc-primary-fg':        colors.primaryForeground,
      '--ncc-secondary':         colors.secondary,
      '--ncc-secondary-fg':      colors.secondaryForeground,
      '--ncc-bg':                colors.background,
      '--ncc-surface':           colors.surface,
      '--ncc-surface-elevated':  colors.surfaceElevated,
      '--ncc-text':              colors.text,
      '--ncc-text-muted':        colors.textMuted,
      '--ncc-border':            colors.border,
      '--ncc-danger':            colors.danger,
      '--ncc-success':           colors.success,
      '--ncc-warning':           colors.warning,
      '--ncc-font-family':       config.typography?.fontFamily ?? "'Inter', 'Segoe UI', system-ui, sans-serif",
      '--ncc-font-size-base':    config.typography?.fontSizeBase ?? '14px',
      '--ncc-border-radius':     config.borderRadius ?? '8px',
    };

    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
    root.setAttribute('data-ncc-theme', config.mode);
  }
}
