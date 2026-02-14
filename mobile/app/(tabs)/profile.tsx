import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

interface Profile {
  display_name: string;
  bio: string | null;
  role: string;
  plan: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ recipes: 0, published: 0, cooked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [{ data: profileData }, { data: recipes }, { data: ratings }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('display_name, bio, role, plan')
          .eq('id', user!.id)
          .single(),
        supabase
          .from('recipes')
          .select('id, visibility')
          .eq('created_by', user!.id),
        supabase
          .from('recipe_ratings')
          .select('id')
          .eq('user_id', user!.id),
      ]);

      setProfile(profileData);
      setStats({
        recipes: (recipes || []).length,
        published: (recipes || []).filter((r) => r.visibility === 'public').length,
        cooked: (ratings || []).length,
      });
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C8553D" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.display_name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Anonymous'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.recipes}</Text>
          <Text style={styles.statLabel}>recipes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.published}</Text>
          <Text style={styles.statLabel}>published</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stats.cooked}</Text>
          <Text style={styles.statLabel}>times cooked</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {profile?.plan === 'premium' ? 'Premium' : 'Free'} plan
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#6B6B6B' },
  name: { fontSize: 22, fontWeight: '600', color: '#1A1A1A' },
  email: { fontSize: 14, color: '#6B6B6B', marginTop: 4 },
  bio: { fontSize: 14, color: '#6B6B6B', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EBE4',
    marginBottom: 24,
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  section: { alignItems: 'center', marginBottom: 32 },
  planBadge: {
    backgroundColor: '#F5F0EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  planText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, color: '#6B6B6B' },
});
