import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Skeleton, { SkeletonLine } from '@/components/ui/Skeleton';
import { colors, spacing, animation } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Masthead skeleton */}
      <Animated.View entering={FadeIn.delay(0)} style={styles.masthead}>
        <SkeletonLine width={160} height={14} />
        <SkeletonLine width={80} height={10} />
      </Animated.View>

      {/* Thick rule */}
      <View style={styles.ruleThick} />

      {/* Featured skeleton */}
      <Animated.View entering={FadeIn.delay(animation.staggerDelay)} style={styles.padded}>
        <SkeletonLine width={60} height={10} />
        <View style={styles.featuredRow}>
          <View style={styles.featuredTextCol}>
            <SkeletonLine width={60} height={10} />
            <SkeletonLine width={SCREEN_WIDTH * 0.5} height={26} />
            <SkeletonLine width={SCREEN_WIDTH * 0.45} height={13} />
            <SkeletonLine width={120} height={11} />
          </View>
          <Skeleton width={130} height={170} borderRadius={0} />
        </View>
      </Animated.View>

      {/* Thin rule */}
      <View style={styles.ruleThin} />

      {/* Index skeleton */}
      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 2)} style={styles.padded}>
        <View style={styles.indexHeaderRow}>
          <SkeletonLine width={100} height={16} />
          <SkeletonLine width={50} height={11} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.indexRow}>
            <SkeletonLine width={24} height={28} />
            <View style={styles.indexTextCol}>
              <SkeletonLine width={60} height={10} />
              <SkeletonLine width={SCREEN_WIDTH * 0.45} height={18} />
              <SkeletonLine width={80} height={11} />
            </View>
            <Skeleton width={56} height={56} borderRadius={0} />
          </View>
        ))}
      </Animated.View>

      {/* Activity skeleton */}
      <Animated.View entering={FadeIn.delay(animation.staggerDelay * 3)} style={styles.padded}>
        <SkeletonLine width={70} height={16} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.tickerRow}>
            <Skeleton width={36} height={36} borderRadius={0} />
            <View style={styles.tickerTextCol}>
              <SkeletonLine width={SCREEN_WIDTH * 0.5} height={13} />
            </View>
            <SkeletonLine width={30} height={10} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ruleThick: {
    height: 3,
    backgroundColor: colors.border,
  },
  padded: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  featuredTextCol: {
    flex: 1,
    gap: 8,
  },
  ruleThin: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginTop: 6,
  },
  indexHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  indexTextCol: {
    flex: 1,
    gap: 4,
  },
  tickerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  tickerTextCol: {
    flex: 1,
  },
});
