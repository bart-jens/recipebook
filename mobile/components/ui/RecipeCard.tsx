import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AnimatedCard from './AnimatedCard';
import StarRating from './StarRating';
import { colors, spacing, typography, radii, fontFamily } from '@/lib/theme';

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
    <AnimatedCard onPress={onPress} style={styles.card}>
      {/* Image area */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {recipe.image_url ? (
          <>
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={[colors.gradientOverlayStart, colors.gradientOverlayEnd]}
              style={styles.imageGradient}
            />
            <Text style={styles.imageTitleOverlay} numberOfLines={2}>
              {recipe.title}
            </Text>
          </>
        ) : (
          <LinearGradient
            colors={[colors.gradientWarmStart, colors.gradientWarmEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholderGradient}
          >
            <FontAwesome name="cutlery" size={isCompact ? 20 : 28} color="rgba(255,255,255,0.3)" />
            <Text style={styles.placeholderTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Meta row below image */}
      <View style={styles.meta}>
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
                <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
              )}
            </View>
          )}
          {recipe.forkCount != null && recipe.forkCount > 0 && (
            <Text style={styles.forkCount}>
              {recipe.forkCount} fork{recipe.forkCount !== 1 ? 's' : ''}
            </Text>
          )}
          {cookTime != null && (
            <Text style={styles.cookTime}>{cookTime} min</Text>
          )}
        </View>
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  imageTitleOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    color: colors.white,
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  placeholderTitle: {
    color: colors.white,
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 17,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  meta: {
    padding: spacing.md,
  },
  creatorName: {
    ...typography.label,
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
  ratingCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  forkCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cookTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
