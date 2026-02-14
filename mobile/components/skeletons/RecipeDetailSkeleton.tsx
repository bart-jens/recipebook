import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from '@/components/ui/Skeleton';
import { spacing, radii, animation } from '@/lib/theme';

export default function RecipeDetailSkeleton() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(0)}>
        <Skeleton width="100%" height={200} borderRadius={radii.lg} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay)}>
        <SkeletonLine width="75%" height={24} style={styles.mt20} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 2)} style={styles.pillRow}>
        <Skeleton width={80} height={28} borderRadius={radii.xl} />
        <Skeleton width={80} height={28} borderRadius={radii.xl} />
        <Skeleton width={90} height={28} borderRadius={radii.xl} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 3)}>
        <SkeletonLine width="100%" style={styles.mt20} />
        <SkeletonLine width="90%" style={styles.mt8} />
        <SkeletonLine width="60%" style={styles.mt8} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 4)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.ingredientRow}>
            <Skeleton width={60} height={14} borderRadius={radii.sm} />
            <SkeletonLine width="50%" />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  mt8: { marginTop: 8 },
  mt20: { marginTop: 20 },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
