import { Platform, TextStyle } from 'react-native';

export const colors = {
  primary: '#2D5F5D',
  primaryLight: '#3D7A72',
  cta: '#D4913D',
  ctaHover: '#BF7D2E',
  background: '#FAF6F0',
  card: '#FFFFFF',
  surface: '#F0EDE6',
  surfaceAlt: '#F5F2EC',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#999999',
  border: '#DDD6CC',
  borderLight: '#E8E2D8',
  starFilled: '#F59E0B',
  starEmpty: '#D1C8BC',
  success: '#15803D',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',
  // Gradient colors
  gradientWarmStart: '#D4913D',
  gradientWarmEnd: '#E8C87C',
  gradientOverlayStart: 'transparent',
  gradientOverlayEnd: 'rgba(0,0,0,0.65)',
  // Skeleton shimmer
  skeletonBase: '#E8E2D8',
  skeletonHighlight: '#F5F2EC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontFamily = {
  serif: 'Fraunces_400Regular',
  serifSemiBold: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
} as const;

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    lineHeight: 16,
  },
  // Serif display styles
  display: { fontSize: 28, fontFamily: fontFamily.serifBold, lineHeight: 34 },
  displaySmall: { fontSize: 22, fontFamily: fontFamily.serifSemiBold, lineHeight: 28 },
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  android: {
    elevation: 2,
  },
  default: {},
}) as Record<string, unknown>;

export const animation = {
  springConfig: { damping: 15, stiffness: 150, mass: 0.8 },
  pressScale: 0.97,
  heartScale: 1.3,
  staggerDelay: 50,
  skeletonDuration: 1200,
} as const;
