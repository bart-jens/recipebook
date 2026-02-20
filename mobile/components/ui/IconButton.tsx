import { TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing } from '@/lib/theme';

interface Props {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
}

export default function IconButton({
  name,
  onPress,
  color = colors.inkMuted,
  size = 16,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <FontAwesome name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.25,
  },
});
