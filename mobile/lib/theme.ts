import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Core palette
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEADE',
  ink: '#141210',
  inkSecondary: '#5C5850',
  inkMuted: '#9C978C',
  border: '#D6D2C8',
  borderStrong: '#141210',
  accent: '#8B4513',
  accentLight: 'rgba(139,69,19,0.07)',
  olive: '#4A5D3A',
  oliveLight: 'rgba(74,93,58,0.08)',

  // Semantic aliases (backward compat)
  primary: '#8B4513',
  primaryLight: 'rgba(139,69,19,0.15)',
  primaryDark: '#6D360F',
  cta: '#8B4513',
  ctaHover: '#6D360F',
  background: '#F6F4EF',
  card: '#FFFFFF',
  text: '#141210',
  textSecondary: '#5C5850',
  textMuted: '#9C978C',
  textOnPrimary: '#FFFFFF',
  borderLight: '#D6D2C8',

  // Functional
  starFilled: '#8B4513',
  starEmpty: '#D6D2C8',
  success: '#4A5D3A',
  successBg: 'rgba(74,93,58,0.08)',
  successBorder: 'rgba(74,93,58,0.20)',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',

  gradientOverlayStart: 'transparent',
  gradientOverlayEnd: '#F6F4EF',

  skeletonBase: '#D6D2C8',
  skeletonHighlight: '#EDEADE',

  accentWash: 'rgba(139,69,19,0.05)',
  accentWashBorder: 'rgba(139,69,19,0.20)',
  accentWashIcon: 'rgba(139,69,19,0.40)',
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
  sans: 'InterTight_400Regular',
  sansLight: 'InterTight_300Light',
  logo: 'InterTight_400Regular',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  // Backward compat aliases — all point to sans now
  display: 'InterTight_400Regular',
  displayItalic: 'InterTight_400Regular',
  mono: 'InterTight_400Regular',
  monoMedium: 'InterTight_400Regular',
  sansMedium: 'InterTight_400Regular',
  sansBold: 'InterTight_400Regular',
  serif: 'InterTight_400Regular',
  serifSemiBold: 'InterTight_400Regular',
  serifBold: 'InterTight_400Regular',
} as const;

export const typography: Record<string, TextStyle> = {
  title: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  heading: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  subheading: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  body: { fontSize: 15, fontFamily: fontFamily.sansLight, lineHeight: 24 },
  bodySmall: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  label: { fontSize: 14, fontFamily: fontFamily.sans, lineHeight: 20 },
  meta: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  metaSmall: { fontSize: 11, fontFamily: fontFamily.sans, lineHeight: 15, letterSpacing: 0.02 * 11 },
  // Backward compat aliases — map old names to new tokens
  display: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  displaySmall: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  sectionTitle: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  h1: { fontSize: 36, fontFamily: fontFamily.sansLight, lineHeight: 40, letterSpacing: -0.03 * 36 },
  h2: { fontSize: 26, fontFamily: fontFamily.sans, lineHeight: 31, letterSpacing: -0.01 * 26 },
  h3: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
  bodyLight: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  caption: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  monoLabel: { fontSize: 11, fontFamily: fontFamily.sans, lineHeight: 15, letterSpacing: 0.02 * 11 },
  monoMeta: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16, letterSpacing: 0.02 * 12 },
  headingSmall: { fontSize: 20, fontFamily: fontFamily.sans, lineHeight: 26 },
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
  springBounce: { damping: 12, stiffness: 180, mass: 0.6 },
  pressScale: 0.995,
  buttonPressScale: 0.94,
  tabPressScale: 0.88,
  pressOpacity: 0.7,
  heartScale: 1.25,
  imageHoverScale: 1.08,
  avatarHoverScale: 1.12,
  checkPopScale: 1.25,
  staggerDelay: 40,
  staggerMax: 10,
  skeletonDuration: 1200,
  fadeInUpDistance: 18,
  fadeInDuration: 550,
} as const;
