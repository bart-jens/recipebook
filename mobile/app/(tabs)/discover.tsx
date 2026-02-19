import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii, animation } from '@/lib/theme';
import RecipeCard from '@/components/ui/RecipeCard';
import ChefCard from '@/components/ui/ChefCard';
import EmptyState from '@/components/ui/EmptyState';
import RecipeListSkeleton from '@/components/skeletons/RecipeListSkeleton';
import { ForkDot } from '@/components/ui/Logo';

type Tab = 'recipes' | 'chefs';
type SortOption = 'newest' | 'rating' | 'popular';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

interface DiscoverRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  created_by: string;
  creatorName: string;
  avgRating: number | null;
  ratingCount: number;
  tags: string[];
}

interface Chef {
  id: string;
  display_name: string;
  avatar_url: string | null;
  recipe_count: number;
  last_cooked: string | null;
  follow_state: 'not_following' | 'following';
}

const PAGE_SIZE = 20;

export default function DiscoverScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'recipes');
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  const enrichRecipes = async (recipeData: any[]): Promise<DiscoverRecipe[]> => {
    const tagSet = new Set<string>();
    for (const r of recipeData) {
      for (const t of (r as any).recipe_tags || []) {
        tagSet.add(t.tag);
      }
    }
    setAllTags(Array.from(tagSet).sort());

    let filtered = recipeData;
    if (selectedTag) {
      filtered = recipeData.filter((r) =>
        ((r as any).recipe_tags || []).some((t: { tag: string }) => t.tag === selectedTag)
      );
    }

    const creatorIds = Array.from(new Set(filtered.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', creatorIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    const recipeIds = filtered.map((r) => r.id);
    const { data: ratings } = await supabase
      .from('recipe_ratings')
      .select('recipe_id, rating')
      .in('recipe_id', recipeIds);

    const ratingMap = new Map<string, { total: number; count: number }>();
    for (const r of ratings || []) {
      const existing = ratingMap.get(r.recipe_id) || { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      ratingMap.set(r.recipe_id, existing);
    }

    const enriched: DiscoverRecipe[] = filtered.map((r) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        image_url: r.image_url,
        prep_time_minutes: r.prep_time_minutes,
        cook_time_minutes: r.cook_time_minutes,
        created_by: r.created_by,
        creatorName: profileMap.get(r.created_by) || 'Unknown',
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
        tags: ((r as any).recipe_tags || []).map((t: { tag: string }) => t.tag),
      };
    });

    if (sort === 'rating') {
      enriched.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sort === 'popular') {
      enriched.sort((a, b) => b.ratingCount - a.ratingCount);
    }

    return enriched;
  };

  const fetchRecipes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: recipeData } = await query;
    let allRecipeData = recipeData || [];

    if (search && allRecipeData.length >= 0) {
      const titleIds = new Set(allRecipeData.map((r: any) => r.id));
      const [{ data: ingMatches }, { data: tagMatches }] = await Promise.all([
        supabase.from('recipe_ingredients').select('recipe_id').ilike('ingredient_name', `%${search}%`),
        supabase.from('recipe_tags').select('recipe_id').ilike('tag', `%${search}%`),
      ]);
      const extraIds = new Set<string>();
      for (const m of [...(ingMatches || []), ...(tagMatches || [])]) {
        if (!titleIds.has(m.recipe_id)) extraIds.add(m.recipe_id);
      }
      if (extraIds.size > 0) {
        const { data: extraData } = await supabase
          .from('recipes')
          .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)')
          .eq('visibility', 'public')
          .in('id', Array.from(extraIds));
        allRecipeData = [...allRecipeData, ...(extraData || [])];
      }
    }

    if (allRecipeData.length === 0) {
      setRecipes([]);
      setAllTags([]);
      setHasMore(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const enriched = await enrichRecipes(allRecipeData);
    setRecipes(enriched);
    setHasMore((recipeData || []).length >= PAGE_SIZE);
    setLoading(false);
    setRefreshing(false);
  }, [search, sort, selectedTag]);

  const fetchChefs = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const followingIds = new Set((following || []).map((f) => f.following_id));

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .neq('id', user.id)
      .order('display_name');

    if (!profiles || profiles.length === 0) {
      setChefs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const profileIds = profiles.map((p) => p.id);

    const [{ data: recipeCounts }, { data: cookLogs }] = await Promise.all([
      supabase
        .from('recipes')
        .select('created_by')
        .in('created_by', profileIds),
      supabase
        .from('cook_log')
        .select('user_id, cooked_at')
        .in('user_id', profileIds)
        .order('cooked_at', { ascending: false }),
    ]);

    const recipeCountMap = new Map<string, number>();
    for (const r of recipeCounts || []) {
      recipeCountMap.set(r.created_by, (recipeCountMap.get(r.created_by) || 0) + 1);
    }

    const lastCookedMap = new Map<string, string>();
    for (const c of cookLogs || []) {
      if (!lastCookedMap.has(c.user_id)) {
        lastCookedMap.set(c.user_id, c.cooked_at);
      }
    }

    const enriched: Chef[] = profiles.map((p) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      recipe_count: recipeCountMap.get(p.id) || 0,
      last_cooked: lastCookedMap.get(p.id) || null,
      follow_state: followingIds.has(p.id) ? 'following' as const : 'not_following' as const,
    }));

    enriched.sort((a, b) => {
      if (a.follow_state !== b.follow_state) {
        return a.follow_state === 'not_following' ? -1 : 1;
      }
      const aTime = a.last_cooked ? new Date(a.last_cooked).getTime() : 0;
      const bTime = b.last_cooked ? new Date(b.last_cooked).getTime() : 0;
      return bTime - aTime;
    });

    setChefs(enriched);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  const loadMoreRecipes = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .range(recipes.length, recipes.length + PAGE_SIZE - 1);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: recipeData } = await query;
    let allRecipeData = recipeData || [];

    if (search) {
      const allLoadedIds = new Set([...recipes.map((r) => r.id), ...allRecipeData.map((r: any) => r.id)]);
      const [{ data: ingMatches }, { data: tagMatches }] = await Promise.all([
        supabase.from('recipe_ingredients').select('recipe_id').ilike('ingredient_name', `%${search}%`),
        supabase.from('recipe_tags').select('recipe_id').ilike('tag', `%${search}%`),
      ]);
      const extraIds = new Set<string>();
      for (const m of [...(ingMatches || []), ...(tagMatches || [])]) {
        if (!allLoadedIds.has(m.recipe_id)) extraIds.add(m.recipe_id);
      }
      if (extraIds.size > 0) {
        const { data: extraData } = await supabase
          .from('recipes')
          .select('id, title, description, image_url, prep_time_minutes, cook_time_minutes, created_by, recipe_tags(tag)')
          .eq('visibility', 'public')
          .in('id', Array.from(extraIds));
        allRecipeData = [...allRecipeData, ...(extraData || [])];
      }
    }

    if (allRecipeData.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    const enriched = await enrichRecipes(allRecipeData);
    setRecipes((prev) => [...prev, ...enriched]);
    setHasMore((recipeData || []).length >= PAGE_SIZE);
    setLoadingMore(false);
  }, [recipes.length, search, sort, selectedTag, loadingMore, hasMore]);

  const handleFollowPress = useCallback(async (chefId: string) => {
    if (!user) return;
    setPendingFollowId(chefId);

    const chef = chefs.find((c) => c.id === chefId);
    if (!chef) return;

    if (chef.follow_state === 'following') {
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', chefId);
      setChefs((prev) =>
        prev.map((c) => c.id === chefId ? { ...c, follow_state: 'not_following' as const } : c)
      );
    } else {
      await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: chefId });
      setChefs((prev) =>
        prev.map((c) => c.id === chefId ? { ...c, follow_state: 'following' as const } : c)
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setPendingFollowId(null);
  }, [user, chefs]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'recipes') {
        fetchRecipes();
      } else {
        fetchChefs();
      }
    }, [activeTab, fetchRecipes, fetchChefs])
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setLoading(true);
  };

  const unfollowedChefs = chefs.filter((c) => c.follow_state === 'not_following');
  const followedChefs = chefs.filter((c) => c.follow_state === 'following');

  const renderChefsList = () => {
    if (loading) {
      return <RecipeListSkeleton />;
    }

    if (chefs.length === 0) {
      return (
        <EmptyState
          icon="users"
          title="No Chefs found yet"
          subtitle="Invite friends to join EefEats!"
          onAction={() => router.push('/invites')}
          actionLabel="Send Invites"
        />
      );
    }

    const sections: { title?: string; data: Chef[] }[] = [];
    if (unfollowedChefs.length > 0) {
      sections.push({ data: unfollowedChefs });
    }
    if (followedChefs.length > 0) {
      sections.push({ title: 'Following', data: followedChefs });
    }

    if (unfollowedChefs.length === 0 && followedChefs.length > 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.chefsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChefs(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.allFollowedCard}>
            <ForkDot size={20} color="rgba(45,95,93,0.3)" />
            <Text style={styles.allFollowedTitle}>You follow all Chefs!</Text>
            <Link href="/invites" asChild>
              <Text style={[styles.allFollowedSubtitle, { color: colors.primary }]}>Invite more friends to join EefEats</Text>
            </Link>
          </View>
          <Text style={styles.chefSectionTitle}>Following</Text>
          {followedChefs.map((chef, index) => (
            <Animated.View
              key={chef.id}
              entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
              style={styles.chefCardWrapper}
            >
              <ChefCard
                id={chef.id}
                displayName={chef.display_name}
                avatarUrl={chef.avatar_url}
                recipeCount={chef.recipe_count}
                lastCooked={chef.last_cooked}
                followState={chef.follow_state}
                onFollowPress={handleFollowPress}
                isPending={pendingFollowId === chef.id}
              />
            </Animated.View>
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.chefsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchChefs(true)}
            tintColor={colors.primary}
          />
        }
      >
        {unfollowedChefs.map((chef, index) => (
          <Animated.View
            key={chef.id}
            entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
            style={styles.chefCardWrapper}
          >
            <ChefCard
              id={chef.id}
              displayName={chef.display_name}
              avatarUrl={chef.avatar_url}
              recipeCount={chef.recipe_count}
              lastCooked={chef.last_cooked}
              followState={chef.follow_state}
              onFollowPress={handleFollowPress}
              isPending={pendingFollowId === chef.id}
            />
          </Animated.View>
        ))}
        {followedChefs.length > 0 && (
          <>
            <Text style={styles.chefSectionTitle}>Following</Text>
            {followedChefs.map((chef, index) => (
              <Animated.View
                key={chef.id}
                entering={index < animation.staggerMax ? FadeInDown.delay((unfollowedChefs.length + index) * animation.staggerDelay).duration(400) : undefined}
                style={styles.chefCardWrapper}
              >
                <ChefCard
                  id={chef.id}
                  displayName={chef.display_name}
                  avatarUrl={chef.avatar_url}
                  recipeCount={chef.recipe_count}
                  lastCooked={chef.last_cooked}
                  followState={chef.follow_state}
                  onFollowPress={handleFollowPress}
                  isPending={pendingFollowId === chef.id}
                />
              </Animated.View>
            ))}
          </>
        )}
        <TouchableOpacity style={styles.inviteCard} activeOpacity={0.7} onPress={() => router.push('/invites')}>
          <Text style={styles.inviteTitle}>Know someone who loves cooking?</Text>
          <Text style={[styles.inviteSubtitle, { color: colors.primary }]}>Invite them to join EefEats</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        {/* Tab segmented control */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
            onPress={() => handleTabChange('recipes')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chefs' && styles.tabActive]}
            onPress={() => handleTabChange('chefs')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'chefs' && styles.tabTextActive]}>Chefs</Text>
          </TouchableOpacity>
        </View>

        {/* Recipe-specific controls */}
        {activeTab === 'recipes' && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, ingredients, tags..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortRow}
            >
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortPill, sort === opt.value && styles.sortPillActive]}
                  onPress={() => setSort(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortPillText, sort === opt.value && styles.sortPillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}
              >
                {selectedTag && (
                  <TouchableOpacity
                    style={styles.clearTagPill}
                    onPress={() => setSelectedTag(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearTagText}>Clear</Text>
                  </TouchableOpacity>
                )}
                {allTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, selectedTag === tag && styles.tagPillActive]}
                    onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagPillText, selectedTag === tag && styles.tagPillTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {activeTab === 'chefs' ? (
        renderChefsList()
      ) : loading ? (
        <RecipeListSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="compass"
          title={search ? 'No results' : 'No published recipes yet'}
          subtitle={
            search
              ? `No recipes match "${search}"`
              : 'Be the first to publish a recipe!'
          }
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRecipes(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMoreRecipes}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
            >
              <RecipeCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}`)}
              />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controlsContainer: {
    padding: spacing.pagePadding,
    paddingBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md - 2,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingRight: spacing.lg,
  },
  sortPill: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sortPillActive: {
    borderBottomColor: colors.primary,
  },
  sortPillText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  sortPillTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingRight: spacing.lg,
  },
  tagPill: {
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tagPillActive: {
    borderBottomColor: colors.primary,
  },
  tagPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagPillTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  clearTagPill: {
    paddingBottom: spacing.xs,
  },
  clearTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  chefsContent: {
    padding: spacing.pagePadding,
    paddingBottom: spacing.xxxl,
  },
  chefCardWrapper: {
    marginBottom: spacing.md,
  },
  chefSectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  allFollowedCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
    backgroundColor: colors.accentWash,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  allFollowedTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  allFollowedSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inviteCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  inviteTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  inviteSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
