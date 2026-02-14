import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from '@/components/ui/Skeleton';
import { spacing, radii, animation } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.4;

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(0)} style={styles.padded}>
        <SkeletonLine width={200} height={28} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay)} style={[styles.padded, styles.statsRow]}>
        <Skeleton width={90} height={56} borderRadius={radii.lg} />
        <Skeleton width={90} height={56} borderRadius={radii.lg} />
        <Skeleton width={90} height={56} borderRadius={radii.lg} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 2)} style={styles.padded}>
        <SkeletonLine width={160} height={18} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 3)} style={[styles.padded, styles.carouselRow]}>
        <Skeleton width={CARD_WIDTH} height={CARD_WIDTH * 1.25 + 40} borderRadius={radii.lg} />
        <Skeleton width={CARD_WIDTH} height={CARD_WIDTH * 1.25 + 40} borderRadius={radii.lg} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    gap: spacing.xxl,
  },
  padded: {
    paddingHorizontal: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  carouselRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
