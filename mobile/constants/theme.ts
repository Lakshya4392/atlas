/**
 * Fashion X — Premium fashion wardrobe app
 * Design System: Minimalist luxury, Scandinavian warmth
 */

export const Colors = {
  // Backgrounds — ultra premium palette
  background: '#FFFFFF',
  backgroundAlt: '#F9F9F9',
  backgroundWarm: '#F5F5F5',
  backgroundGray: '#F2F2F7',
  backgroundDark: '#0A0A0A',
  iconBg: '#F0F0F0',

  // Surfaces — elevated and refined
  surface: '#FFFFFF',
  surfaceAlt: '#FCFCFC',
  surfaceWarm: '#F9F9F9',
  surfaceElevated: '#FFFFFF',
  surfaceDark: '#1C1C1E',

  // Brand colors — sophisticated black and white
  primary: '#0A0A0A',
  primaryLight: '#2C2C2E',
  accent: '#0A0A0A',
  accentLight: '#8E8E93',
  accentWarm: '#D1D1D6',
  accentMuted: '#AEAEB2',

  // Text hierarchy — perfect contrast
  textPrimary: '#0A0A0A',
  textSecondary: '#666666',
  textTertiary: '#8E8E93',
  textMuted: '#AEAEB2',
  textLight: '#D1D1D6',
  textInverse: '#FFFFFF',
  textAccent: '#0A0A0A',
  textPrice: '#0A0A0A',

  // Borders — refined and subtle
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  borderMed: '#D1D1D6',
  borderDark: '#8E8E93',
  borderFocus: '#0A0A0A',

  // Status colors — elegant
  success: '#2D6A4F',
  successBg: 'rgba(45,106,79,0.06)',
  successLight: 'rgba(45,106,79,0.12)',
  error: '#C0392B',
  errorBg: 'rgba(192,57,43,0.06)',
  warning: '#F39C12',
  warningBg: 'rgba(243,156,18,0.06)',

  // Overlays — premium depth
  overlayDark: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(255,255,255,0.95)',
  overlayBlur: 'rgba(255,255,255,0.85)',
  overlayAccent: 'rgba(10,10,10,0.05)',

  // Gradients — luxury feel
  gradientOverlay: ['transparent', 'rgba(10,10,10,0.8)'] as const,
  gradientOverlayTop: ['rgba(10,10,10,0.15)', 'transparent'] as const,
  gradientDark: ['#1C1C1E', '#0A0A0A'] as const,
  gradientLight: ['#FFFFFF', '#F9F9F9'] as const,
  gradientWarm: ['#F9F9F9', '#F2F2F7'] as const,
  gradientAccent: ['#0A0A0A', '#2C2C2E'] as const,
  gradientAccentLight: ['#8E8E93', '#AEAEB2'] as const,

  // Interactive states — refined feedback
  press: 'rgba(10,10,10,0.05)',
  pressDark: 'rgba(255,255,255,0.1)',
  pressAccent: 'rgba(10,10,10,0.08)',
  hover: 'rgba(10,10,10,0.02)',
  focus: 'rgba(10,10,10,0.12)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 72,
  '8xl': 80,
  '9xl': 96,
  '10xl': 128,
};

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  card: 12,
  button: 8,
  input: 6,
  modal: 16,
  hero: 20,
  full: 9999,
};

export const FontSize = {
  '3xs': 8,
  '2xs': 10,
  xs: 12,
  sm: 14,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
  '7xl': 48,
  '8xl': 56,
  '9xl': 64,
  hero: 72,
};

export const FontWeight = {
  thin: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '700' as const,
  black: '900' as const,
};

export const LineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

export const Shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};

// Animation curves
export const Animations = {
  spring: { damping: 18, stiffness: 150, mass: 0.8 } as const,
  smooth: { damping: 25, stiffness: 120, mass: 0.9 } as const,
  gentle: { damping: 30, stiffness: 100, mass: 1 } as const,
};

// Premium glass effect
export const Glass = {
  light: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dark: {
    backgroundColor: 'rgba(15,15,15,0.7)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
};
