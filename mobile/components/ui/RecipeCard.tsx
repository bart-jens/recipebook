import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StarRating from './StarRating';
import { ForkDot } from './Logo';
import { colors, spacing, typography, radii, fontFamily, animation } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface RecipeData {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  creatorName?: string;
  avgRating?: number | null;
  ratingCount?: number;
  forkCount?: number;
  isFavorited?: boolean;
}

interface Props {
  recipe: RecipeData;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'compact';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RecipeCard({ recipe, onPress, onLongPress, variant = 'default' }: Props) {
  const isCompact = variant === 'compact';
  const imageHeight = isCompact ? 100 : 160;
  const scale = useSharedValue(1);

  const cookTime = recipe.cook_time_minutes || recipe.prep_time_minutes;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(animation.pressScale, animation.pressSpring);
  }

  function handlePressOut() {
    scale.value = withSpring(1, animation.pressSpring);
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {/* Image area */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {recipe.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <ForkDot size={28} color="rgba(45,95,93,0.2)" />
          </View>
        )}
      </View>

      {/* Content below image */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, recipe.isFavorited && styles.titleWithHeart]} numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.isFavorited && (
            <FontAwesome name="heart" size={12} color={colors.dangerLight} style={styles.heartIcon} />
          )}
        </View>
        {recipe.creatorName && (
          <Text style={styles.creatorName} numberOfLines={1}>
            {recipe.creatorName}
          </Text>
        )}
        <View style={styles.metaRow}>
          {recipe.avgRating != null && (
            <View style={styles.ratingRow}>
              <StarRating rating={recipe.avgRating} size={12} />
              {recipe.ratingCount != null && recipe.ratingCount > 0 && (
                <Text style={styles.metaText}>({recipe.ratingCount})</Text>
              )}
            </View>
          )}
          {recipe.forkCount != null && recipe.forkCount > 0 && (
            <Text style={styles.metaText}>
              {recipe.forkCount} fork{recipe.forkCount !== 1 ? 's' : ''}
            </Text>
          )}
          {cookTime != null && (
            <Text style={styles.metaText}>{cookTime} min</Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLetter: {
    fontFamily: fontFamily.sansBold,
    fontSize: 36,
    color: colors.accentWashIcon,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  titleWithHeart: {
    marginRight: spacing.sm,
  },
  heartIcon: {
    marginTop: 3,
  },
  creatorName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
