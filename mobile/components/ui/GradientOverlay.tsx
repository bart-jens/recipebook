import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';

interface Props {
  height?: number | string;
  style?: ViewStyle;
}

export default function GradientOverlay({ height = '50%', style }: Props) {
  return (
    <LinearGradient
      colors={[colors.gradientOverlayStart, colors.gradientOverlayEnd]}
      style={[styles.gradient, { height: height as number }, style]}
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
