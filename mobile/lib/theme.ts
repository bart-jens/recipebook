import { Platform, TextStyle } from 'react-native';

export const colors = {
  primary: '#2D5F5D',
  primaryLight: '#3D7A72',
  primaryDark: '#234B49',
  cta: '#2D5F5D',
  ctaHover: '#234B49',
  background: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceAlt: '#F5F5F5',
  text: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  textOnPrimary: '#FFFFFF',
  border: '#E8E8E8',
  borderLight: '#E8E8E8',
  starFilled: '#F59E0B',
  starEmpty: '#E8E8E8',
  success: '#15803D',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',
  // Gradient colors (kept for parallax hero overlay only)
  gradientOverlayStart: 'transparent',
  gradientOverlayEnd: 'rgba(0,0,0,0.65)',
  // Skeleton shimmer
  skeletonBase: '#E8E8E8',
  skeletonHighlight: '#F5F5F5',
  // Teal wash (accent at varying opacity)
  accentWash: 'rgba(45,95,93,0.05)',
  accentWashBorder: 'rgba(45,95,93,0.20)',
  accentWashIcon: 'rgba(45,95,93,0.40)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  pagePadding: 20,
  sectionGap: 32,
} as const;

export const fontFamily = {
  // Single typeface system — DM Sans only
  serif: 'DMSans_400Regular', // aliased for backward compat
  serifSemiBold: 'DMSans_500Medium', // aliased for backward compat
  serifBold: 'DMSans_700Bold', // aliased for backward compat
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  logo: 'Fraunces_700Bold',
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
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Display styles (recipe titles — DM Sans)
  display: { fontSize: 28, fontFamily: fontFamily.sansBold, fontWeight: '700', lineHeight: 34 },
  displaySmall: { fontSize: 22, fontFamily: fontFamily.sansMedium, fontWeight: '600', lineHeight: 28 },
  // Heading styles (page/section headings)
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
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  android: {
    elevation: 0,
  },
  default: {},
}) as Record<string, unknown>;

export const animation = {
  springConfig: { damping: 15, stiffness: 150, mass: 0.8 },
  pressSpring: { damping: 25, stiffness: 200 },
  pressScale: 0.98,
  buttonPressScale: 0.96,
  pressOpacity: 0.7,
  heartScale: 1.3,
  staggerDelay: 30,
  staggerMax: 10,
  skeletonDuration: 1200,
} as const;
