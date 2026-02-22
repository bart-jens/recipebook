import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography } from '@/lib/theme';
import { ForkDot } from './Logo';


interface Collection {
  id: string;
  name: string;
  description: string | null;
  recipe_count: number;
  cover_url: string | null;
}

interface Props {
  collections: Collection[];
  userPlan: string;
  onRefresh: () => void;
}

export default function CollectionsSection({ collections, userPlan, onRefresh }: Props) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const atLimit = userPlan === 'free' && collections.length >= 5;

  async function handleCreate() {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newName.trim(), description: newDesc.trim() || null });

    if (error) {
      Alert.alert('Error', error.message.includes('Free plan limited')
        ? 'Free plan limited to 5 collections. Upgrade to premium for unlimited.'
        : error.message);
    } else {
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      onRefresh();
    }
    setCreating(false);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete collection', `Delete "${name}"? Recipes will not be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('collections').delete().eq('id', id);
          onRefresh();
        },
      },
    ]);
  }

  function handleRename(id: string, currentName: string) {
    Alert.prompt('Rename collection', '', async (newName) => {
      if (newName && newName.trim()) {
        await supabase.from('collections').update({ name: newName.trim() }).eq('id', id);
        onRefresh();
      }
    }, 'plain-text', currentName);
  }

  if (collections.length === 0 && !showCreate) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>{collections.length} total</Text>
          {atLimit ? (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>5/5</Text>
            </View>
          ) : (
            <Pressable onPress={() => setShowCreate(true)} style={styles.newButton}>
              <Text style={styles.newButtonText}>New</Text>
            </Pressable>
          )}
        </View>
      </View>

      {collections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {collections.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => router.push(`/recipe/collection/${c.id}`)}
              onLongPress={() => {
                Alert.alert(c.name, undefined, [
                  { text: 'Rename', onPress: () => handleRename(c.id, c.name) },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDelete(c.id, c.name) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              activeOpacity={0.7}
            >
              {c.cover_url ? (
                <Image
                  source={{ uri: c.cover_url }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.cardPlaceholder}>
                  <ForkDot size={14} color="rgba(139,69,19,0.15)" />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.cardCount}>
                  {c.recipe_count} recipe{c.recipe_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Collection name"
                placeholderTextColor={colors.inkMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </View>
            <View style={styles.inputWrapSecondary}>
              <TextInput
                style={styles.inputSecondary}
                placeholder="Description (optional)"
                placeholderTextColor={colors.inkMuted}
                value={newDesc}
                onChangeText={setNewDesc}
              />
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.createBtn, (!newName.trim() || creating) && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                <Text style={styles.createBtnText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const CARD_WIDTH = 140;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.pagePadding,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  newButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newButtonText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  limitBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  limitText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: spacing.pagePadding,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.625,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.625,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 10,
  },
  cardName: {
    ...typography.label,
    color: colors.ink,
  },
  cardCount: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  inputWrap: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingBottom: 6,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    paddingVertical: 0,
  },
  inputWrapSecondary: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: spacing.lg,
  },
  inputSecondary: {
    ...typography.bodySmall,
    color: colors.ink,
    paddingVertical: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  createBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: {
    ...typography.metaSmall,
    color: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
