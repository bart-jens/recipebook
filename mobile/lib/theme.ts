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
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'InterTight_400Regular',
  sansLight: 'InterTight_300Light',
  sansMedium: 'InterTight_500Medium',
  sansBold: 'InterTight_700Bold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  logo: 'InterTight_700Bold',
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  // Backward compat aliases
  serif: 'InstrumentSerif_400Regular',
  serifSemiBold: 'InstrumentSerif_400Regular',
  serifBold: 'InstrumentSerif_400Regular',
} as const;

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 40, fontFamily: fontFamily.display, lineHeight: 40 },
  displaySmall: { fontSize: 28, fontFamily: fontFamily.display, lineHeight: 30 },
  sectionTitle: { fontSize: 18, fontFamily: fontFamily.display, lineHeight: 22 },
  h1: { fontSize: 32, fontFamily: fontFamily.display, lineHeight: 34 },
  h2: { fontSize: 28, fontFamily: fontFamily.display, lineHeight: 30 },
  h3: { fontSize: 20, fontFamily: fontFamily.display, lineHeight: 24 },
  body: { fontSize: 14, fontFamily: fontFamily.sans, lineHeight: 21 },
  bodySmall: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  bodyLight: { fontSize: 13, fontFamily: fontFamily.sansLight, lineHeight: 19 },
  label: { fontSize: 14, fontFamily: fontFamily.sansMedium, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: fontFamily.sans, lineHeight: 16 },
  monoLabel: { fontSize: 10, fontFamily: fontFamily.mono, textTransform: 'uppercase', letterSpacing: 1.4 },
  monoMeta: { fontSize: 11, fontFamily: fontFamily.mono },
  heading: { fontSize: 22, fontFamily: fontFamily.display, lineHeight: 26 },
  headingSmall: { fontSize: 18, fontFamily: fontFamily.display, lineHeight: 22 },
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
