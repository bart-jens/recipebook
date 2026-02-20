import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fontFamily } from '@/lib/theme';

type Variant = 'success' | 'premium' | 'default';

interface Props {
  label: string;
  variant?: Variant;
}

export default function Badge({ label, variant = 'default' }: Props) {
  return (
    <View style={[styles.base, variantBgStyles[variant]]}>
      <Text style={[styles.text, variantTextStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  text: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

const variantBgStyles: Record<Variant, ViewStyle> = {
  success: { backgroundColor: 'transparent', borderColor: colors.olive },
  premium: { backgroundColor: 'transparent', borderColor: colors.accent },
  default: { backgroundColor: 'transparent', borderColor: colors.border },
};

const variantTextStyles: Record<Variant, TextStyle> = {
  success: { color: colors.olive },
  premium: { color: colors.accent },
  default: { color: colors.inkSecondary },
};
