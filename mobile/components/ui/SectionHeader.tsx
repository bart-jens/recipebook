import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';

interface Props {
  title: string;
  count?: number;
}

export default function SectionHeader({ title, count }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {count != null && (
        <Text style={styles.count}>{count}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  count: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
});
