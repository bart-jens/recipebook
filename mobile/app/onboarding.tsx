import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii } from '@/lib/theme';
import Button from '@/components/ui/Button';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [userEditedUsername, setUserEditedUsername] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load profile on mount
  useState(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('display_name, avatar_url, onboarded_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarded_at) {
          router.replace('/(tabs)');
          return;
        }
        const name = data?.display_name || '';
        setDisplayName(name);
        setUsername(suggestUsername(name));
        setAvatarUrl(data?.avatar_url || null);
        setLoaded(true);
      });
  });

  const validateFormat = (val: string) => /^[a-z0-9_]{3,30}$/.test(val);

  const doCheck = useCallback(async (val: string) => {
    if (!validateFormat(val)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await fetch(
        `${API_BASE}/api/username/check?username=${encodeURIComponent(val)}&userId=${user?.id || ''}`
      );
      const data = await res.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, [user?.id]);

  function handleDisplayNameChange(val: string) {
    setDisplayName(val);
    if (!userEditedUsername) {
      const suggested = suggestUsername(val);
      setUsername(suggested);
      if (suggested.length >= 3) {
        clearTimeout(checkTimer.current);
        checkTimer.current = setTimeout(() => doCheck(suggested), 400);
      } else {
        setUsernameStatus('idle');
      }
    }
  }

  function handleUsernameChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    setUsername(cleaned);
    setUserEditedUsername(true);
    clearTimeout(checkTimer.current);
    if (cleaned.length >= 3) {
      checkTimer.current = setTimeout(() => doCheck(cleaned), 400);
    } else {
      setUsernameStatus(cleaned.length > 0 ? 'invalid' : 'idle');
    }
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
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

      setAvatarUrl(publicUrl);
    } catch {
      setError('Failed to upload photo');
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!displayName.trim()) { setError('Display name is required'); return; }
    if (!validateFormat(username)) { setError('Username is invalid'); return; }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name: displayName.trim(),
        username,
        avatar_url: avatarUrl,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      if (updateError.code === '23505') {
        setError('This username is already taken');
      } else {
        setError(updateError.message);
      }
      setSaving(false);
      return;
    }

    router.replace('/(tabs)');
  }

  const initial = displayName ? displayName[0].toUpperCase() : '?';
  const canSubmit =
    displayName.trim().length > 0 &&
    validateFormat(username) &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'checking' &&
    !saving &&
    !uploading;

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Welcome to EefEats</Text>
          <Text style={styles.subtitle}>Set up your profile to get started</Text>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickAvatar}
            activeOpacity={0.7}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Text style={styles.avatarOverlayText}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Display Name */}
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={handleDisplayNameChange}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.statusRow}>
            {usernameStatus === 'checking' && (
              <Text style={styles.statusChecking}>Checking...</Text>
            )}
            {usernameStatus === 'available' && (
              <Text style={styles.statusAvailable}>Available</Text>
            )}
            {usernameStatus === 'taken' && (
              <Text style={styles.statusError}>Already taken</Text>
            )}
            {usernameStatus === 'invalid' && username.length > 0 && (
              <Text style={styles.statusError}>
                3-30 characters, lowercase letters, numbers, underscores
              </Text>
            )}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Button
              title={saving ? 'Setting up...' : 'Get started'}
              onPress={handleSubmit}
              size="lg"
              disabled={!canSubmit}
              loading={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.pagePadding, paddingBottom: 40 },
  title: { ...typography.h2, textAlign: 'center', color: colors.text },
  subtitle: { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xxl },

  avatarContainer: { alignSelf: 'center', marginBottom: spacing.xxl, position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: '600', color: colors.textSecondary },
  avatarOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, borderBottomLeftRadius: 48, borderBottomRightRadius: 48, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarOverlayText: { fontSize: 11, fontWeight: '600', color: colors.white },

  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.lg },
  input: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text },

  usernameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.md },
  atSymbol: { fontSize: 16, color: colors.textMuted, marginRight: spacing.xs },
  usernameInput: { flex: 1, paddingVertical: spacing.md, fontSize: 16, color: colors.text },

  statusRow: { minHeight: 20, marginTop: spacing.xs },
  statusChecking: { ...typography.caption, color: colors.textMuted },
  statusAvailable: { ...typography.caption, color: colors.success },
  statusError: { ...typography.caption, color: colors.danger },

  error: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.md, textAlign: 'center' },
  buttonContainer: { marginTop: spacing.xxl },
});
