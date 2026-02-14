import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface DiscoverRecipe {
  id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  created_by: string;
  creatorName: string;
  avgRating: number | null;
  ratingCount: number;
}

export default function DiscoverScreen() {
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, prep_time_minutes, cook_time_minutes, created_by')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: recipeData } = await query;
    if (!recipeData || recipeData.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Batch fetch creator names
    const creatorIds = Array.from(new Set(recipeData.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', creatorIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name]));

    // Batch fetch ratings
    const recipeIds = recipeData.map((r) => r.id);
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

    const enriched: DiscoverRecipe[] = recipeData.map((r) => {
      const ratingInfo = ratingMap.get(r.id);
      return {
        ...r,
        creatorName: profileMap.get(r.created_by) || 'Unknown',
        avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : null,
        ratingCount: ratingInfo?.count || 0,
      };
    });

    setRecipes(enriched);
    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text key={n} style={[styles.star, n <= Math.round(rating) ? styles.starFilled : styles.starEmpty]}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#C8553D" />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {search ? 'No results' : 'No published recipes yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? `No recipes match "${search}"`
              : 'Be the first to publish a recipe!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/recipe/${item.id}`)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.creatorName}>by {item.creatorName}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View style={styles.cardFooter}>
                {item.avgRating !== null && (
                  <View style={styles.ratingRow}>
                    {renderStars(item.avgRating)}
                    <Text style={styles.ratingCount}>({item.ratingCount})</Text>
                  </View>
                )}
                {(item.prep_time_minutes || item.cook_time_minutes) && (
                  <Text style={styles.cardMeta}>
                    {[
                      item.prep_time_minutes && `${item.prep_time_minutes} min prep`,
                      item.cook_time_minutes && `${item.cook_time_minutes} min cook`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  searchContainer: { padding: 16, paddingBottom: 0 },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', maxWidth: 260 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  creatorName: { fontSize: 13, color: '#C8553D', marginTop: 2 },
  cardDesc: { marginTop: 6, fontSize: 14, color: '#6B6B6B', lineHeight: 20 },
  cardFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsRow: { flexDirection: 'row' },
  star: { fontSize: 14 },
  starFilled: { color: '#F59E0B' },
  starEmpty: { color: '#D1C8BC' },
  ratingCount: { fontSize: 12, color: '#999' },
  cardMeta: { fontSize: 12, color: '#999' },
});
