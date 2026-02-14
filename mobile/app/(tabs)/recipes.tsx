import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  is_favorite: boolean;
  visibility: string;
}

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('recipes')
      .select('id, title, description, prep_time_minutes, cook_time_minutes, is_favorite, visibility')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    // Sort favorites first
    const sorted = (data || []).sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return 0;
    });
    setRecipes(sorted);
    setLoading(false);
  }, [user, search]);

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your recipes..."
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
            {search ? 'No results' : 'No recipes yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search
              ? `No recipes match "${search}"`
              : 'Import a recipe from the web app to get started.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/recipe/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.badges}>
                  {item.is_favorite && <Text style={styles.heart}>♥</Text>}
                  {item.visibility === 'public' && (
                    <View style={styles.publicBadge}>
                      <Text style={styles.publicText}>Public</Text>
                    </View>
                  )}
                </View>
              </View>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
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
  emptyText: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  heart: { color: '#EF4444', fontSize: 16 },
  publicBadge: { backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  publicText: { fontSize: 11, color: '#15803D', fontWeight: '500' },
  cardDesc: { marginTop: 4, fontSize: 14, color: '#6B6B6B', lineHeight: 20 },
  cardMeta: { marginTop: 8, fontSize: 12, color: '#999' },
});
