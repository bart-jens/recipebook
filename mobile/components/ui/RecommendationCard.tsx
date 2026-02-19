import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily, radii } from '@/lib/theme';
import Avatar from './Avatar';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

interface RecommendationCardProps {
  shareId: string;
  title: string;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceType: string;
  imageUrl: string | null;
  tags: string[] | null;
  userRating: number | null;
  shareNotes: string | null;
  sharedAt: string;
  sharerName: string;
  sharerAvatarUrl: string | null;
  sharerId: string;
  recipeId: string;
}

export default function RecommendationCard({
  title,
  sourceUrl,
  sourceName,
  sourceType,
  imageUrl,
  tags,
  userRating,
  shareNotes,
  sharedAt,
  sharerName,
  sharerAvatarUrl,
  sharerId,
}: RecommendationCardProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sourceDisplay =
    sourceName ||
    (sourceUrl
      ? new URL(sourceUrl).hostname.replace(/^www\./, '')
      : null);

  const handleSave = async () => {
    if (!user || saving || saved) return;
    setSaving(true);

    try {
      // Try re-importing from source URL
      if (sourceUrl) {
        try {
          const res = await fetch(`${API_BASE}/api/extract-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: sourceUrl }),
          });
          if (res.ok) {
            const parsed = await res.json();
            const { data: recipe } = await supabase
              .from('recipes')
              .insert({
                title: parsed.title || title,
                description: parsed.description || null,
                instructions: parsed.instructions || null,
                prep_time_minutes: parsed.prep_time_minutes || null,
                cook_time_minutes: parsed.cook_time_minutes || null,
                servings: parsed.servings || null,
                source_url: sourceUrl,
                source_name: parsed.source_name || sourceName,
                source_type: 'url',
                image_url: parsed.imageUrl || imageUrl,
                created_by: user.id,
              })
              .select('id')
              .single();

            if (recipe) {
              // Insert ingredients
              if (parsed.ingredients?.length > 0) {
                await supabase.from('recipe_ingredients').insert(
                  parsed.ingredients.map((ing: { ingredient_name: string; quantity: number | null; unit: string | null; notes: string | null }, i: number) => ({
                    recipe_id: recipe.id,
                    ingredient_name: ing.ingredient_name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    notes: ing.notes,
                    order_index: i,
                  }))
                );
              }

              // Insert tags
              const tagsToInsert = parsed.tags?.length > 0 ? parsed.tags : (tags || []);
              if (tagsToInsert.length > 0) {
                await supabase.from('recipe_tags').insert(
                  tagsToInsert.map((tag: string) => ({ recipe_id: recipe.id, tag }))
                );
              }

              setSaved(true);
              router.push(`/recipe/${recipe.id}`);
              return;
            }
          }
        } catch {
          // Source URL failed — fall through to metadata copy
        }
      }

      // Fallback: save metadata only
      const { data: recipe } = await supabase
        .from('recipes')
        .insert({
          title,
          source_url: sourceUrl,
          source_name: sourceName,
          source_type: 'url',
          image_url: imageUrl,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (recipe) {
        if (tags && tags.length > 0) {
          await supabase.from('recipe_tags').insert(
            tags.map((tag) => ({ recipe_id: recipe.id, tag }))
          );
        }
        setSaved(true);
        router.push(`/recipe/${recipe.id}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={i <= rating ? styles.starFilled : styles.starEmpty}
        >
          {'\u2605'}
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.card}>
      <View style={styles.main}>
        {/* Thumbnail */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailLetter}>
              {title.slice(0, 1)}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          {/* Sharer info */}
          <View style={styles.sharerRow}>
            <TouchableOpacity
              style={styles.sharerLink}
              activeOpacity={0.7}
              onPress={() => router.push(`/profile/${sharerId}`)}
            >
              <Avatar name={sharerName} size="sm" imageUrl={sharerAvatarUrl} />
              <Text style={styles.sharerName}>{sharerName}</Text>
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {new Date(sharedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Source attribution */}
          {sourceDisplay && (
            <TouchableOpacity
              activeOpacity={sourceUrl ? 0.7 : 1}
              onPress={() => {
                if (sourceUrl) Linking.openURL(sourceUrl);
              }}
            >
              <Text style={sourceUrl ? styles.sourceLink : styles.sourceText}>
                {sourceUrl ? 'via' : 'from'} {sourceDisplay}
              </Text>
            </TouchableOpacity>
          )}

          {/* Rating */}
          {userRating != null && renderStars(userRating)}
        </View>
      </View>

      {/* Notes */}
      {shareNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>
            {'\u201C'}{shareNotes}{'\u201D'}
          </Text>
        </View>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <View style={styles.tagsSection}>
          {tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={saving || saved}
          style={styles.actionButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.cta} />
          ) : (
            <Text style={[styles.actionText, (saved) && styles.actionTextDisabled]}>
              {saved ? 'Saved' : 'Save to my recipes'}
            </Text>
          )}
        </TouchableOpacity>
        {sourceUrl && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL(sourceUrl)}
            style={styles.actionButton}
          >
            <Text style={styles.secondaryActionText}>View source</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  main: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.cta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailLetter: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  info: {
    flex: 1,
  },
  sharerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sharerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sharerName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  sourceLink: {
    ...typography.caption,
    color: colors.cta,
    marginTop: 2,
  },
  sourceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: spacing.xs,
  },
  starFilled: {
    fontSize: 13,
    color: colors.starFilled,
  },
  starEmpty: {
    fontSize: 13,
    color: colors.border,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  notesText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    minHeight: 28,
    justifyContent: 'center',
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.cta,
  },
  actionTextDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
