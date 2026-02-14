import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '@/lib/theme';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  name: string;
  size?: Size;
}

const dimensions: Record<Size, { container: number; font: number }> = {
  sm: { container: 32, font: 13 },
  md: { container: 48, font: 20 },
  lg: { container: 72, font: 28 },
};

export default function Avatar({ name, size = 'md' }: Props) {
  const d = dimensions[size];
  const initial = (name || '?')[0].toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: d.container,
          height: d.container,
          borderRadius: d.container / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: d.font }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
