import { Platform, TextStyle } from 'react-native';

export const colors = {
  primary: '#2D5F5D',
  primaryLight: '#3D7A72',
  primaryDark: '#234B49',
  cta: '#2D5F5D',
  ctaHover: '#234B49',
  background: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceAlt: '#F8FAFC',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#E2E8F0',
  starFilled: '#F59E0B',
  starEmpty: '#CBD5E1',
  success: '#15803D',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',
  // Gradient colors
  gradientWarmStart: '#2D5F5D',
  gradientWarmEnd: '#5BA8A3',
  gradientOverlayStart: 'transparent',
  gradientOverlayEnd: 'rgba(0,0,0,0.65)',
  // Skeleton shimmer
  skeletonBase: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
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
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
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
  // Serif display styles (recipe titles only)
  display: { fontSize: 28, fontFamily: fontFamily.serifBold, lineHeight: 34 },
  displaySmall: { fontSize: 22, fontFamily: fontFamily.serifSemiBold, lineHeight: 28 },
  // Sans heading styles (page/section headings)
  heading: { fontSize: 22, fontFamily: fontFamily.sansBold, lineHeight: 28 },
  headingSmall: { fontSize: 18, fontFamily: fontFamily.sansBold, lineHeight: 24 },
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
