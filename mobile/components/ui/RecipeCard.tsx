import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import StarRating from './StarRating';
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
}

interface Props {
  recipe: RecipeData;
  onPress: () => void;
  variant?: 'default' | 'compact';
}

export default function RecipeCard({ recipe, onPress, variant = 'default' }: Props) {
  const isCompact = variant === 'compact';
  const imageHeight = isCompact ? 100 : 160;

  const cookTime = recipe.cook_time_minutes || recipe.prep_time_minutes;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={animation.pressOpacity}
      style={styles.card}
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
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Content below image */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
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
    </TouchableOpacity>
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
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    marginBottom: spacing.xs,
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
