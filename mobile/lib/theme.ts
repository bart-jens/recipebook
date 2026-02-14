import { Platform, TextStyle } from 'react-native';

export const colors = {
  primary: '#C8553D',
  primaryLight: '#D4715C',
  background: '#FFFBF5',
  card: '#FFFFFF',
  surface: '#F5F0EA',
  surfaceAlt: '#FAFAF8',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#999999',
  border: '#E8E0D8',
  borderLight: '#F0EBE4',
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
