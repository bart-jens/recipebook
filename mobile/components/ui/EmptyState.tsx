import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';

interface Props {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'book', title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <FontAwesome name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl + spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
