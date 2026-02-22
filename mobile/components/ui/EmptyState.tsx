import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import { ForkDot } from '@/components/ui/Logo';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onAction?: () => void;
  actionLabel?: string;
}

export default function EmptyState({ title, subtitle, icon, onAction, actionLabel }: Props) {
  return (
    <View style={styles.container}>
      {icon ? (
        <FontAwesome name={icon} size={28} color={colors.accentWashIcon} style={styles.icon} />
      ) : (
        <View style={styles.icon}>
          <ForkDot size={24} color={colors.accentWashIcon} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {onAction && actionLabel && (
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={onAction}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.accentWash,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    fontSize: 18,
    lineHeight: 22,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  actionButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
  },
  actionLabel: {
    ...typography.metaSmall,
    color: colors.white,
  },
});
