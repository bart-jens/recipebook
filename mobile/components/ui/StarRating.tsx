import { View, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing } from '@/lib/theme';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 16, interactive = false, onRate }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        const star = (
          <FontAwesome
            name={filled ? 'star' : 'star-o'}
            size={size}
            color={filled ? colors.starFilled : colors.starEmpty}
          />
        );

        if (interactive) {
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onRate?.(n)}
              style={styles.touch}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              {star}
            </TouchableOpacity>
          );
        }

        return (
          <View key={n} style={styles.starWrap}>
            {star}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  touch: { padding: spacing.xs },
  starWrap: { marginRight: 1 },
});
