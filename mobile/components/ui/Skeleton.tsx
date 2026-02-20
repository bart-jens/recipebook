import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors, radii, animation } from '@/lib/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width, height, borderRadius = radii.md, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: animation.skeletonDuration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.cardContainer, style]}>
      <Skeleton width="100%" height={140} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} style={styles.mt8} />
      </View>
    </View>
  );
}

export function SkeletonLine({ width = '100%', height = 14, style }: { width?: number | string; height?: number; style?: ViewStyle }) {
  return <Skeleton width={width} height={height} borderRadius={radii.sm} style={style} />;
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
  },
  mt8: {
    marginTop: 8,
  },
});
