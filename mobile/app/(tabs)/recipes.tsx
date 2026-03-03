import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { RecipeListItem } from '../../../shared/types/domain';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, typography } from '@/lib/theme';
import EmptyState from '@/components/ui/EmptyState';
import RecipeListSkeleton from '@/components/skeletons/RecipeListSkeleton';
import CollectionsSection from '@/components/ui/CollectionsSection';
import { RecipePlaceholder } from '@/lib/recipe-placeholder';
import { formatTime } from '@/lib/format';
import { fetchRecipes } from '@/lib/queries/recipes';
import { queryKeys } from '@/lib/queries/keys';

type SortOption = 'updated' | 'alpha' | 'rating' | 'quickest';
type FilterOption = '' | 'imported' | 'published' | 'saved' | 'favorited' | 'cooked';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Recent' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'quickest', label: 'Quickest' },
];

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'imported', label: 'Imported' },
  { value: 'published', label: 'Published' },
  { value: 'saved', label: 'Saved' },
  { value: 'favorited', label: 'Favorites' },
  { value: 'cooked', label: 'Cooked' },
];

const COURSE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'side dish', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'snack', label: 'Snack' },
];



export default function RecipesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('updated');
  const [activeFilter, setActiveFilter] = useState<FilterOption>(
    (filterParam as FilterOption) || ''
  );
  useEffect(() => {
    if (filterParam) setActiveFilter(filterParam as FilterOption);
  }, [filterParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: allRecipes = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.recipes(user?.id ?? '', debouncedSearch),
    queryFn: () => fetchRecipes(user!.id, debouncedSearch),
    enabled: !!user,
  });

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string; description: string | null; recipe_count: number; cover_url: string | null }[]>([]);
  const [collectionPlan, setCollectionPlan] = useState('free');
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!user) return;

    try {
      const [{ data: cols }, { data: profile }] = await Promise.all([
        supabase
          .from('collections')
          .select('id, name, description, cover_image_url')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase.from('user_profiles').select('plan').eq('id', user.id).single(),
      ]);

      setCollectionPlan(profile?.plan || 'free');

      if (!cols || cols.length === 0) {
        setCollections([]);
        return;
      }

      // Get recipe counts
      const { data: memberships } = await supabase
        .from('collection_recipes')
        .select('collection_id, recipe_id')
        .in('collection_id', cols.map((c: { id: string }) => c.id));

      const countMap = new Map<string, number>();
      for (const m of memberships || []) {
        countMap.set((m as { collection_id: string }).collection_id, (countMap.get((m as { collection_id: string }).collection_id) || 0) + 1);
      }

      // Get cover images
      const needCover = cols.filter((c: { cover_image_url: string | null }) => !c.cover_image_url);
      const coverMap = new Map<string, string>();
      if (needCover.length > 0) {
        const { data: coverData } = await supabase
          .from('collection_recipes')
          .select('collection_id, recipes(image_url)')
          .in('collection_id', needCover.map((c: { id: string }) => c.id))
          .order('added_at', { ascending: true });

        for (const cr of (coverData || []) as unknown as { collection_id: string; recipes: { image_url: string | null } | null }[]) {
          if (!coverMap.has(cr.collection_id) && cr.recipes?.image_url) {
            coverMap.set(cr.collection_id, cr.recipes.image_url);
          }
        }
      }

      setCollections(cols.map((c: { id: string; name: string; description: string | null; cover_image_url: string | null }) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        recipe_count: countMap.get(c.id) || 0,
        cover_url: c.cover_image_url || coverMap.get(c.id) || null,
      })));
    } catch (e) {
      console.error('fetchCollections failed:', e);
    }
  }, [user]);

  const handlePublishRecipe = async (recipeId: string) => {
    if (!user) return;
    setPublishingId(recipeId);
    const { error } = await supabase
      .from('recipes')
      .update({ visibility: 'public', published_at: new Date().toISOString() })
      .eq('id', recipeId)
      .eq('created_by', user.id);
    setPublishingId(null);
    if (!error) {
      setPublishedIds((prev) => new Set(prev).add(recipeId));
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes(user.id, debouncedSearch) });
      }
      fetchCollections();
    }, [user, debouncedSearch, fetchCollections, queryClient])
  );

  const recipes = useMemo(() => {
    let filtered = [...allRecipes];
    if (selectedCourse) {
      filtered = filtered.filter((r) =>
        r.tags.some((t) => t.toLowerCase() === selectedCourse)
      );
    }
    if (activeFilter === 'imported') {
      // 'manual' and 'fork' are user-created, not imports
      filtered = filtered.filter((r) =>
        ['url', 'photo', 'telegram', 'instagram'].includes(r.source_type)
      );
    } else if (activeFilter === 'published') {
      filtered = filtered.filter((r) => r.visibility === 'public' && !r.isSaved);
    } else if (activeFilter === 'saved') {
      filtered = filtered.filter((r) => r.isSaved);
    } else if (activeFilter === 'favorited') {
      filtered = filtered.filter((r) => r.isFavorited);
    } else if (activeFilter === 'cooked') {
      filtered = filtered.filter((r) => r.hasCooked);
    }
    filtered.sort((a, b) => {
      if (a.isFavorited !== b.isFavorited) return a.isFavorited ? -1 : 1;
      if (sort === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
      if (sort === 'alpha') return a.title.localeCompare(b.title);
      if (sort === 'quickest') {
        const aTotal = (a.prep_time_minutes || 0) + (a.cook_time_minutes || 0) || 999;
        const bTotal = (b.prep_time_minutes || 0) + (b.cook_time_minutes || 0) || 999;
        return aTotal - bTotal;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return filtered;
  }, [allRecipes, sort, activeFilter, selectedCourse]);

  const renderRecipeItem = useCallback(({ item, index }: { item: RecipeListItem; index: number }) => {
    const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);
    const timeStr = formatTime(totalTime);
    const tag = item.tags.length > 0 ? item.tags[0] : null;

    return (
        <Pressable
          style={styles.resultItem}
          onPress={() => router.push(`/recipe/${item.id}`)}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.resultThumb}
              contentFit="cover"
            />
          ) : (
            <RecipePlaceholder id={item.id} size={48} />
          )}
          <View style={styles.resultContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleWrap}>
                {tag && (
                  <Text style={styles.resultCategory}>{tag}</Text>
                )}
                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              </View>
              {item.isFavorited && (
                <FontAwesome name="heart" size={12} color={colors.accent} style={styles.heartIcon} />
              )}
            </View>
            <View style={styles.resultFooter}>
              {timeStr && (
                <Text style={styles.resultFooterText}>{timeStr}</Text>
              )}
              {item.avgRating != null && (
                <Text style={styles.resultFooterText}>{item.avgRating.toFixed(1)}</Text>
              )}
              {item.tags.length > 1 && (
                <Text style={styles.resultFooterText} numberOfLines={1}>{item.tags.slice(1).join(', ')}</Text>
              )}
            </View>
            {item.visibility === 'private' && !item.isSaved && (
              <View style={styles.privateRow}>
                {publishedIds.has(item.id) ? (
                  <Text style={styles.publishedLabel}>Published</Text>
                ) : (
                  <>
                    <Text style={styles.privateLabel}>Private</Text>
                    {(item.source_type === 'manual' || item.source_type === 'fork') && (
                      <>
                        <Text style={styles.privateDot}> · </Text>
                        <Pressable
                          onPress={() => handlePublishRecipe(item.id)}
                          disabled={publishingId === item.id}
                        >
                          <Text style={[styles.publishLink, publishingId === item.id && styles.publishLinkDisabled]}>
                            {publishingId === item.id ? '...' : 'Publish'}
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </Pressable>
    );
  }, [publishedIds, publishingId]);

  const renderHeader = () => (
    <View>
      {/* Header: title + action buttons */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recipes</Text>
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setShowImportMenu(true)}
            >
              <Text style={styles.actionButtonText}>Import</Text>
            </Pressable>
            <Pressable
              style={styles.actionButtonPrimary}
              onPress={() => router.push('/recipe/new')}
            >
              <Text style={styles.actionButtonPrimaryText}>Create</Text>
            </Pressable>
          </View>
        </View>

        {/* Search bar — bottom-border style */}
        <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
          <FontAwesome name="search" size={14} color={colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ingredient"
            placeholderTextColor={colors.inkMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          <Pressable
            style={styles.filterToggle}
            onPress={() => setShowFilters((v) => !v)}
          >
            <FontAwesome name="sliders" size={12} color={showFilters ? colors.ink : colors.inkMuted} />
            <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
              Filter
            </Text>
            {(sort !== 'updated' || selectedCourse !== null) && (
              <View style={styles.filterDot} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Collections */}
      <CollectionsSection
        collections={collections}
        userPlan={collectionPlan}
        onRefresh={fetchCollections}
      />

      {/* Filter tabs — always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.secondaryFilterRow}
      >
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={`filter-${opt.value}`}
            style={styles.secondaryTab}
            onPress={() => setActiveFilter(opt.value)}
          >
            <Text style={[styles.secondaryTabText, activeFilter === opt.value && styles.secondaryTabTextActive]}>
              {opt.label}
            </Text>
            {activeFilter === opt.value && <View style={styles.secondaryTabLine} />}
          </Pressable>
        ))}
      </ScrollView>

      {showFilters && (
        <>
          {/* Sort tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.filterTab}
                onPress={() => setSort(opt.value)}
              >
                <Text style={[styles.filterTabText, sort === opt.value && styles.filterTabTextActive]}>
                  {opt.label}
                </Text>
                {sort === opt.value && <View style={styles.filterTabLine} />}
              </Pressable>
            ))}
          </ScrollView>

          {/* Course tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryFilterRow}
          >
            {COURSE_OPTIONS.map((opt) => (
              <Pressable
                key={`course-${opt.value}`}
                style={styles.secondaryTab}
                onPress={() => setSelectedCourse(opt.value || null)}
              >
                <Text style={[styles.secondaryTabText, (selectedCourse || '') === opt.value && (opt.value ? styles.courseTabTextActive : styles.secondaryTabTextActive)]}>
                  {opt.label}
                </Text>
                {(selectedCourse || '') === opt.value && <View style={opt.value ? styles.courseTabLine : styles.secondaryTabLine} />}
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Result count */}
      {recipes.length > 0 && !isLoading && (
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            {search ? ` for "${search}"` : ''}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isError ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Could not load recipes</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <RecipeListSkeleton />
        </View>
      ) : recipes.length === 0 ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <EmptyState
            icon="book"
            title={search ? 'No results' : 'No recipes yet'}
            subtitle={
              search
                ? `No recipes match "${search}"`
                : 'Import a recipe or create your first one!'
            }
          />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={renderRecipeItem}
        />
      )}

      {showImportMenu && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowImportMenu(false)}>
          <View style={styles.importMenu}>
            <Text style={styles.importMenuTitle}>Import Recipe</Text>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-url'); }}
            >
              <FontAwesome name="link" size={18} color={colors.accent} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Link</Text>
                <Text style={styles.importOptionDesc}>Paste a link from any recipe site or Instagram</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.importOption}
              activeOpacity={0.7}
              onPress={() => { setShowImportMenu(false); router.push('/recipe/import-photo'); }}
            >
              <FontAwesome name="camera" size={18} color={colors.accent} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>From Photo</Text>
                <Text style={styles.importOptionDesc}>Scan a photo of a recipe with AI</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  overline: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  actionButtonPrimary: {
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonPrimaryText: {
    ...typography.metaSmall,
    color: colors.bg,
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

  // Filter toggle button
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterToggleText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  filterToggleTextActive: {
    color: colors.ink,
  },
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },

  // Sort tabs
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

  // Filter + Course tabs
  secondaryFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  secondaryTab: {
    paddingVertical: 6,
    paddingRight: 12,
    position: 'relative',
  },
  secondaryTabText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  secondaryTabTextActive: {
    color: colors.ink,
  },
  secondaryTabLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 12,
    height: 1.5,
    backgroundColor: colors.ink,
  },
  courseTabTextActive: {
    color: colors.accent,
  },
  courseTabLine: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 12,
    height: 1.5,
    backgroundColor: colors.accent,
  },
  tabDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  // Count
  countRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  count: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },

  // Recipe items — index-item pattern
  resultItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultThumb: {
    width: 48,
    height: 48,
    borderRadius: 0,
    alignSelf: 'center',
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleWrap: {
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
  heartIcon: {
    marginTop: 4,
    marginLeft: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  resultFooterText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },

  // Private row
  privateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  privateLabel: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    opacity: 0.6,
  },
  privateDot: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    opacity: 0.4,
  },
  publishLink: {
    ...typography.metaSmall,
    color: colors.accent,
  },
  publishLinkDisabled: {
    opacity: 0.5,
  },
  publishedLabel: {
    ...typography.metaSmall,
    color: colors.olive,
  },

  // Error state
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  errorText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButtonText: {
    ...typography.metaSmall,
    color: colors.ink,
  },

  // Import modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  importMenu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  importMenuTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.lg,
  },
  importOptionText: { flex: 1 },
  importOptionTitle: {
    ...typography.label,
    color: colors.ink,
  },
  importOptionDesc: {
    ...typography.bodySmall,
    color: colors.inkSecondary,
    marginTop: 2,
  },
});
