import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { spacing, animation } from '@/lib/theme';

export default function RecipeListSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(i * animation.staggerDelay)}
        >
          <SkeletonCard style={styles.card} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    // Uses default SkeletonCard styling
  },
});
