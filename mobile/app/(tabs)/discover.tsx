import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, animation } from '@/lib/theme';
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

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

    // Load saved recipe IDs for current user
    if (user) {
      const { data: saved } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', user.id);
      setSavedRecipeIds(new Set((saved || []).map((s) => s.recipe_id)));
    }

    setLoading(false);
    setRefreshing(false);
  }, [search, sort, selectedTag, user]);

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
        .eq('visibility', 'public')
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

  const toggleSave = useCallback(async (recipeId: string) => {
    if (!user) return;
    const isSaved = savedRecipeIds.has(recipeId);
    // Optimistic update
    setSavedRecipeIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(recipeId); else next.add(recipeId);
      return next;
    });
    if (isSaved) {
      await supabase.from('saved_recipes').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
    } else {
      await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: recipeId });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [user, savedRecipeIds]);

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

  const renderRecipeItem = ({ item, index }: { item: DiscoverRecipe; index: number }) => {
    const cookTime = item.cook_time_minutes || item.prep_time_minutes;
    const tag = item.tags.length > 0 ? item.tags[0] : null;

    return (
      <Animated.View
        entering={index < animation.staggerMax ? FadeInDown.delay(index * animation.staggerDelay).duration(400) : undefined}
      >
        <Pressable
          style={styles.resultItem}
          onPress={() => router.push(`/recipe/${item.id}`)}
        >
          <View style={styles.resultContent}>
            {tag && (
              <Text style={styles.resultCategory}>{tag}</Text>
            )}
            <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
              <Text style={styles.resultDesc} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.resultFooter}>
              <Text style={styles.resultFooterText}>By {item.creatorName}</Text>
              {cookTime && (
                <Text style={styles.resultFooterText}>{formatTime(cookTime)}</Text>
              )}
              {item.avgRating != null && (
                <Text style={styles.resultFooterText}>{item.avgRating.toFixed(1)}</Text>
              )}
              {user && item.created_by !== user.id && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleSave(item.id);
                  }}
                  hitSlop={8}
                >
                  <FontAwesome
                    name={savedRecipeIds.has(item.id) ? 'bookmark' : 'bookmark-o'}
                    size={12}
                    color={savedRecipeIds.has(item.id) ? colors.accent : colors.inkMuted}
                  />
                </Pressable>
              )}
            </View>
          </View>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.resultThumb}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.resultThumb, { backgroundColor: colors.surfaceAlt }]} />
          )}
        </Pressable>
      </Animated.View>
    );
  };

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
              tintColor={colors.inkMuted}
            />
          }
        >
          <View style={styles.allFollowedCard}>
            <ForkDot size={20} color="rgba(45,95,93,0.3)" />
            <Text style={styles.allFollowedTitle}>You follow all Chefs!</Text>
            <Link href="/invites" asChild>
              <Text style={styles.allFollowedSubtitle}>Invite more friends to join EefEats</Text>
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
            tintColor={colors.inkMuted}
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
        <Pressable style={styles.inviteCard} onPress={() => router.push('/invites')}>
          <Text style={styles.inviteTitle}>Know someone who loves cooking?</Text>
          <Text style={styles.inviteSubtitle}>Invite them to join EefEats</Text>
        </Pressable>
      </ScrollView>
    );
  };

  // Build all filter tabs: Recipes, Chefs, then sort options + tags when on recipes tab
  const renderFilterTabs = () => {
    const tabs: { key: string; label: string; isActive: boolean; onPress: () => void }[] = [
      {
        key: 'tab-recipes',
        label: 'Recipes',
        isActive: activeTab === 'recipes',
        onPress: () => handleTabChange('recipes'),
      },
      {
        key: 'tab-chefs',
        label: 'Chefs',
        isActive: activeTab === 'chefs',
        onPress: () => handleTabChange('chefs'),
      },
    ];

    if (activeTab === 'recipes') {
      for (const opt of SORT_OPTIONS) {
        tabs.push({
          key: `sort-${opt.value}`,
          label: opt.label,
          isActive: sort === opt.value,
          onPress: () => setSort(opt.value),
        });
      }
    }

    return (
      <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 3).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={styles.filterTab}
              onPress={tab.onPress}
            >
              <Text style={[styles.filterTabText, tab.isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {tab.isActive && <View style={styles.filterTabLine} />}
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderTagRow = () => {
    if (activeTab !== 'recipes' || allTags.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagRow}
      >
        {selectedTag && (
          <Pressable
            style={styles.tagPill}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={styles.tagClearText}>Clear</Text>
          </Pressable>
        )}
        {allTags.map((tag) => (
          <Pressable
            key={tag}
            style={styles.tagPill}
            onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
          >
            <Text style={[styles.tagPillText, selectedTag === tag && styles.tagPillTextActive]}>
              {tag}
            </Text>
            {selectedTag === tag && <View style={styles.tagActiveLine} />}
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  const hasActiveFilter = selectedTag !== null;

  const renderHeader = () => (
    <View>
      {/* Header: overline + title */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        {/* Search bar — bottom-border style */}
        <Animated.View entering={FadeInDown.delay(animation.staggerDelay * 2).duration(400)}>
          <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
            <FontAwesome name="search" size={14} color={colors.inkMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or chefs"
              placeholderTextColor={colors.inkMuted}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => setShowFilters((v) => !v)}
              style={styles.filterButton}
              hitSlop={8}
            >
              <FontAwesome name="sliders" size={12} color={showFilters ? colors.ink : colors.inkMuted} />
              <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>Filter</Text>
              {hasActiveFilter && <View style={styles.filterDot} />}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Filter tabs — always visible */}
      {renderFilterTabs()}

      {/* Tag filter row — behind filter toggle */}
      {showFilters && renderTagRow()}
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'chefs' ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          {renderChefsList()}
        </View>
      ) : loading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <RecipeListSkeleton />
        </View>
      ) : recipes.length === 0 ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <EmptyState
            icon="compass"
            title={search ? 'No results' : 'No published recipes yet'}
            subtitle={
              search
                ? `No recipes match "${search}"`
                : 'Be the first to publish a recipe!'
            }
          />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRecipes(true)}
              tintColor={colors.inkMuted}
            />
          }
          onEndReached={loadMoreRecipes}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.inkMuted} />
              </View>
            ) : <View style={{ height: 100 }} />
          }
          renderItem={renderRecipeItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  overline: {
    ...typography.meta,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    marginBottom: 14,
  },

  // Search — bottom-border style
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingBottom: 6,
    gap: 8,
  },
  searchWrapFocused: {
    borderBottomColor: colors.accent,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    paddingVertical: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  filterButtonTextActive: {
    color: colors.ink,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingVertical: 8,
    paddingRight: 14,
    position: 'relative',
  },
  filterTabText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  filterTabTextActive: {
    color: colors.ink,
  },
  filterTabLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 14,
    height: 2,
    backgroundColor: colors.ink,
  },

  // Tag filter row
  tagRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 12,
  },
  tagPill: {
    position: 'relative',
    paddingBottom: 4,
  },
  tagPillText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  tagPillTextActive: {
    color: colors.accent,
  },
  tagClearText: {
    ...typography.metaSmall,
    color: colors.accent,
  },
  tagActiveLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.accent,
  },

  // Results list — index-item pattern
  listContent: {
    paddingBottom: 0,
  },
  resultItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultCategory: {
    ...typography.metaSmall,
    color: colors.accent,
    marginBottom: 2,
  },
  resultTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: 3,
  },
  resultDesc: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    marginBottom: 6,
  },
  resultFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  resultFooterText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  resultThumb: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignSelf: 'center',
  },

  // Footer
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  // Chefs tab
  chefsContent: {
    padding: spacing.pagePadding,
    paddingBottom: spacing.xxxl,
  },
  chefCardWrapper: {
    marginBottom: spacing.md,
  },
  chefSectionTitle: {
    ...typography.meta,
    color: colors.inkMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  allFollowedCard: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  allFollowedTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginTop: spacing.md,
  },
  allFollowedSubtitle: {
    ...typography.bodySmall,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  inviteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  inviteTitle: {
    ...typography.subheading,
    color: colors.ink,
  },
  inviteSubtitle: {
    ...typography.bodySmall,
    color: colors.accent,
    marginTop: spacing.xs,
  },
});
