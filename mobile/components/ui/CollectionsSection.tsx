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
import { colors, spacing, typography, radii } from '@/lib/theme';
import EmptyState from './EmptyState';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Collections</Text>
        {atLimit ? (
          <Text style={styles.limitText}>5/5</Text>
        ) : (
          <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.7}>
            <Text style={styles.newButton}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {collections.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>Create your first collection</Text>
        </TouchableOpacity>
      ) : (
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
                  <Text style={styles.cardPlaceholderLetter}>
                    {c.name.slice(0, 1)}
                  </Text>
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
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textMuted}
              value={newDesc}
              onChangeText={setNewDesc}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, (!newName.trim() || creating) && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreate(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: spacing.pagePadding,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  newButton: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
  },
  limitText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.pagePadding,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.625,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.625,
    backgroundColor: colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderLetter: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.accentWashIcon,
  },
  cardContent: {
    padding: spacing.sm,
  },
  cardName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  cardCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: spacing.pagePadding,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.accentWash,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  createButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
