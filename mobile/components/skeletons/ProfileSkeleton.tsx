import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton, { SkeletonCircle, SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';
import { spacing, radii, animation } from '@/lib/theme';

export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(0)} style={styles.header}>
        <SkeletonCircle size={64} />
        <SkeletonLine width={140} height={20} style={styles.mt12} />
        <SkeletonLine width={200} height={14} style={styles.mt8} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay)} style={styles.statsRow}>
        <Skeleton width={60} height={40} borderRadius={radii.md} />
        <Skeleton width={60} height={40} borderRadius={radii.md} />
        <Skeleton width={60} height={40} borderRadius={radii.md} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 2)}>
        <SkeletonCard />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 3)} style={styles.mt12}>
        <SkeletonCard />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
});
