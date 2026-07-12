export type ThemeMode = 'dark' | 'light' | 'custom';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSizeBase: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightBold: number;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  borderRadius?: string;
  logoUrl?: string;
  brandName?: string;
}
