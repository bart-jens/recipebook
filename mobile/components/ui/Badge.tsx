import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radii, typography } from '@/lib/theme';

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
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
});

const variantBgStyles: Record<Variant, ViewStyle> = {
  success: { backgroundColor: colors.successBg },
  premium: { backgroundColor: colors.surface },
  default: { backgroundColor: colors.surface },
};

const variantTextStyles: Record<Variant, TextStyle> = {
  success: { color: colors.success },
  premium: { color: colors.primary },
  default: { color: colors.textSecondary },
};
