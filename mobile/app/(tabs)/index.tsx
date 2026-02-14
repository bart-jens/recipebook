import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

interface RecentRecipe {
  id: string;
  title: string;
  updated_at: string;
}

interface Stats {
  totalRecipes: number;
  favorites: number;
  timeCooked: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [stats, setStats] = useState<Stats>({ totalRecipes: 0, favorites: 0, timeCooked: 0 });
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      async function load() {
        const [{ data: profile }, { data: recipes }, { data: ratings }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('recipes')
            .select('id, title, updated_at, is_favorite')
            .eq('created_by', user!.id)
            .order('updated_at', { ascending: false })
            .limit(5),
          supabase
            .from('recipe_ratings')
            .select('id')
            .eq('user_id', user!.id),
        ]);

        setDisplayName(profile?.display_name || '');
        const allRecipes = recipes || [];
        setStats({
          totalRecipes: allRecipes.length,
          favorites: allRecipes.filter((r) => r.is_favorite).length,
          timeCooked: (ratings || []).length,
        });
        setRecentRecipes(allRecipes.slice(0, 5));
        setLoading(false);
      }

      load();
    }, [user])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C8553D" />
      </View>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {greeting()}, {displayName || 'Chef'}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRecipes}</Text>
          <Text style={styles.statLabel}>recipes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.timeCooked}</Text>
          <Text style={styles.statLabel}>times cooked</Text>
        </View>
      </View>

      {/* Recent recipes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Updated</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentRecipes.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No recipes yet. Import one from the web app!</Text>
          </View>
        ) : (
          recentRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.recentCard}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
            >
              <Text style={styles.recentTitle}>{recipe.title}</Text>
              <Text style={styles.recentDate}>
                {new Date(recipe.updated_at).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionLabel}>My Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20, paddingTop: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#C8553D' },
  statLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#C8553D', fontWeight: '500' },

  // Recent recipes
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EBE4',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  recentTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', flex: 1 },
  recentDate: { fontSize: 12, color: '#999', marginLeft: 8 },

  emptySection: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#6B6B6B', textAlign: 'center' },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, color: '#6B6B6B', fontWeight: '500' },
});
