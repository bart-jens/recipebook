import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';

// Pre-imported Lottie sources
const lottieAssets = {
  'empty-recipes': require('@/assets/lottie/empty-recipes.json'),
  'no-results': require('@/assets/lottie/no-results.json'),
  'empty-state': require('@/assets/lottie/empty-state.json'),
} as const;

type LottieAssetKey = keyof typeof lottieAssets;

interface Props {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  lottie?: LottieAssetKey;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, lottie, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      {lottie ? (
        <LottieView
          source={lottieAssets[lottie]}
          autoPlay
          loop
          style={styles.lottie}
        />
      ) : (
        <View style={styles.iconCircle}>
          <FontAwesome name={icon || 'book'} size={32} color={colors.textMuted} />
        </View>
      )}
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
  lottie: {
    width: 160,
    height: 160,
    marginBottom: spacing.md,
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
