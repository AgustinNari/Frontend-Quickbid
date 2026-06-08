

export const colors = {
  primary: '#0055D1',
  primaryDark: '#0047B0',
  primaryLight: '#3D7DDE',

  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',

  text: '#111827',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLabel: '#374151',

  border: '#D1D5DB',
  borderMuted: '#E5E7EB',
  divider: '#F3F4F6',

  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  overlay: 'rgba(0, 0, 0, 0.4)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.5,
} as const;

export const shadow = {
  none: {
    shadowColor: colors.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 10,
  },
  topBar: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 12,
  },
} as const;

export const controlHeight = {
  sm: 36,
  md: 44,
  base: 52,
  lg: 60,
} as const;

export const layout = {
  screenPaddingHorizontal: spacing.xl,
  screenPaddingVertical: spacing['2xl'],
  headerHeight: 56,
  bottomNavHeight: 68,
  bottomNavLogoOverhang: 26,
} as const;
