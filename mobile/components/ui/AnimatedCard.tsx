import React from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, radii, animation } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export default function AnimatedCard({ children, onPress, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={animation.pressOpacity}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
});
