import React from 'react';
import { Alert, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, animation } from '@/lib/theme';

const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome);

interface Props {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  disabled?: boolean;
}

export default function AnimatedHeart({ isFavorite, onToggle, size = 24, disabled = false }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.35 : 1,
  }));

  const handlePress = () => {
    if (disabled) {
      Alert.alert('Cook first', 'Cook this recipe to add it to favorites.');
      return;
    }
    scale.value = withSequence(
      withSpring(animation.heartScale, { damping: 8, stiffness: 200 }),
      withSpring(1, animation.springConfig)
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <AnimatedIcon
        name={isFavorite ? 'heart' : 'heart-o'}
        size={size}
        color={isFavorite ? colors.accent : colors.border}
        style={animatedStyle}
      />
    </Pressable>
  );
}
