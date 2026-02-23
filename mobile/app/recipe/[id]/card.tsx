import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import { RecipePlaceholder } from '@/lib/recipe-placeholder';

interface RecipeCard {
  id: string;
  title: string;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  source_type: string;
  visibility: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  tags: string[];
  creator_display_name: string;
  creator_avatar_url: string | null;
}

export default function RecipeCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Use SECURITY DEFINER RPC to bypass RLS for private recipes
      const { data } = await (supabase.rpc as any)('get_recipe_card', {
        p_recipe_id: id,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setCard({
          id: row.id,
          title: row.title,
          image_url: row.image_url,
          source_name: row.source_name,
          source_url: row.source_url,
          source_type: row.source_type || '',
          visibility: row.visibility || '',
          prep_time_minutes: row.prep_time_minutes,
          cook_time_minutes: row.cook_time_minutes,
          servings: row.servings,
          tags: row.tags || [],
          creator_display_name: row.creator_display_name || '',
          creator_avatar_url: row.creator_avatar_url || null,
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const backButton = (
    <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
      <FontAwesome name="chevron-left" size={18} color={colors.accent} />
    </Pressable>
  );

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: '', headerLeft: () => backButton }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </>
    );
  }

  if (!card) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: '', headerLeft: () => backButton }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Recipe not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const sourceDisplay = card.source_name
    || (card.source_url
      ? (() => { try { return new URL(card.source_url).hostname.replace(/^www\./, ''); } catch { return card.source_url; } })()
      : null);

  const firstTag = card.tags?.[0] || null;

  return (
    <>
      <Stack.Screen options={{ headerTitle: card.title, headerLeft: () => backButton }} />
      <View style={styles.container}>
        {card.image_url ? (
          <Image
            source={{ uri: card.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.noImageHeader}>
            <RecipePlaceholder id={card.id} style={StyleSheet.absoluteFillObject} />
            {firstTag && (
              <Text style={styles.noImageTag}>{firstTag}</Text>
            )}
            <Text style={styles.noImageTitle} numberOfLines={3}>{card.title}</Text>
            {sourceDisplay && (
              <Text style={styles.noImageSource}>{sourceDisplay}</Text>
            )}
          </View>
        )}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.body}>
          <Text style={styles.title}>{card.title}</Text>

          {sourceDisplay && (
            <Text style={styles.source}>
              From {sourceDisplay}
            </Text>
          )}

          {/* Creator */}
          <View style={styles.creatorRow}>
            {card.creator_avatar_url ? (
              <Image
                source={{ uri: card.creator_avatar_url }}
                style={styles.creatorAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.creatorAvatarFallback}>
                <Text style={styles.creatorAvatarLetter}>
                  {card.creator_display_name?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName}>{card.creator_display_name}</Text>
          </View>

          {/* Meta */}
          {(card.prep_time_minutes || card.cook_time_minutes || card.servings) && (
            <View style={styles.metaRow}>
              {card.prep_time_minutes && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Prep</Text>
                  <Text style={styles.metaValue}>{formatTime(card.prep_time_minutes)}</Text>
                </View>
              )}
              {card.cook_time_minutes && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Cook</Text>
                  <Text style={styles.metaValue}>{formatTime(card.cook_time_minutes)}</Text>
                </View>
              )}
              {card.servings && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Servings</Text>
                  <Text style={styles.metaValue}>{card.servings}</Text>
                </View>
              )}
            </View>
          )}

          {/* Note */}
          <Text style={styles.noteText}>
            In {card.creator_display_name ? `${card.creator_display_name}'s` : "someone's"} personal cookbook. The full recipe is saved privately.
          </Text>
        </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 300,
  },
  noImageHeader: {
    height: 200,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  noImageTag: {
    ...typography.metaSmall,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  noImageTitle: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
    textAlign: 'center',
  },
  noImageSource: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  body: {
    padding: spacing.xl,
  },
  title: {
    ...typography.heading,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
  },
  source: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: spacing.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  creatorAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarLetter: {
    fontSize: 12,
    fontFamily: fontFamily.sans,
    color: colors.inkMuted,
  },
  creatorName: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  metaItem: {},
  metaLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  metaValue: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.ink,
    marginTop: 2,
  },
  noteText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.border,
    marginTop: spacing.xxl,
  },
  backButton: {
    paddingLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.inkMuted,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 26,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  backLink: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: colors.accent,
  },
});
