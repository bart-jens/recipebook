import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography } from '@/lib/theme';
import Button from '@/components/ui/Button';

interface ProfileData {
  display_name: string;
  bio: string;
  is_private: boolean;
  avatar_url: string | null;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [wasPrivate, setWasPrivate] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, bio, is_private, avatar_url')
        .eq('id', user!.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setIsPrivate(data.is_private);
        setAvatarUrl(data.avatar_url);
        setWasPrivate(data.is_private);
      }
      setLoading(false);
    }

    load();
  }, [user]);

  const pickAndUploadAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const path = `${user!.id}/${Date.now()}.jpg`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;

    setSaving(true);
    try {
      // If switching from private to public, auto-approve pending requests
      if (wasPrivate && !isPrivate) {
        const { data: requests } = await supabase
          .from('follow_requests')
          .select('requester_id')
          .eq('target_id', user.id);

        if (requests && requests.length > 0) {
          await supabase.from('user_follows').insert(
            requests.map((r) => ({
              follower_id: r.requester_id,
              following_id: user.id,
            }))
          );
          await supabase
            .from('follow_requests')
            .delete()
            .eq('target_id', user.id);
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          is_private: isPrivate,
        })
        .eq('id', user.id);

      if (error) throw error;

      router.back();
    } catch (err) {
      console.error('Profile update failed:', err);
      Alert.alert('Save failed', 'Could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Edit Profile' }} />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </>
    );
  }

  const initial = (displayName || '?')[0]?.toUpperCase() || '?';

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Edit Profile' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar} activeOpacity={0.7}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 300))}
            placeholder="Tell people a bit about yourself..."
            placeholderTextColor={colors.inkMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/300</Text>
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Private account</Text>
              <Text style={styles.privacyDescription}>
                {isPrivate
                  ? 'Only approved followers can see your recipes and activity'
                  : 'Anyone can follow you and see your recipes'}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          {wasPrivate && !isPrivate && (
            <Text style={styles.privacyWarning}>
              Switching to public will automatically approve all pending follow requests.
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} variant="primary" size="lg" disabled={saving || !displayName.trim()} />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.xl },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...typography.title,
    color: colors.inkSecondary,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },

  field: { marginBottom: spacing.xl },
  label: {
    ...typography.metaSmall,
    color: colors.inkSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: 10,
    color: colors.ink,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  privacyCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyText: { flex: 1, marginRight: spacing.md },
  privacyTitle: {
    ...typography.label,
    color: colors.ink,
  },
  privacyDescription: {
    ...typography.meta,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  privacyWarning: {
    ...typography.meta,
    color: colors.accent,
    marginTop: spacing.sm,
  },

  actions: { gap: spacing.sm },
});
