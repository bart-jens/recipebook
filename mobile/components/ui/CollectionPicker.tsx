import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, radii } from '@/lib/theme';

interface CollectionItem {
  id: string;
  name: string;
  contains_recipe: boolean;
}

interface Props {
  recipeId: string;
  visible: boolean;
  onClose: () => void;
}

export default function CollectionPicker({ recipeId, visible, onClose }: Props) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible && user) {
      fetchCollections();
    }
  }, [visible, user, recipeId]);

  async function fetchCollections() {
    if (!user) return;
    setLoading(true);

    const [{ data: userCollections }, { data: memberships }] = await Promise.all([
      supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('collection_recipes')
        .select('collection_id')
        .eq('recipe_id', recipeId),
    ]);

    const memberSet = new Set((memberships || []).map((m: { collection_id: string }) => m.collection_id));

    setCollections(
      (userCollections || []).map((c: { id: string; name: string }) => ({
        ...c,
        contains_recipe: memberSet.has(c.id),
      }))
    );
    setLoading(false);
  }

  async function handleToggle(collectionId: string, currentlyContains: boolean) {
    // Optimistic update
    setCollections(
      collections.map((c) =>
        c.id === collectionId ? { ...c, contains_recipe: !currentlyContains } : c
      )
    );

    if (currentlyContains) {
      await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipeId);
    } else {
      await supabase
        .from('collection_recipes')
        .insert({ collection_id: collectionId, recipe_id: recipeId });
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !user) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newName.trim() })
      .select('id')
      .single();

    if (error) {
      Alert.alert('Error', error.message.includes('Free plan limited')
        ? 'Free plan limited to 5 collections. Upgrade to premium for unlimited.'
        : error.message);
      setCreating(false);
      return;
    }

    // Add recipe to new collection
    await supabase
      .from('collection_recipes')
      .insert({ collection_id: data.id, recipe_id: recipeId });

    setCollections([
      ...collections,
      { id: data.id, name: newName.trim(), contains_recipe: true },
    ]);
    setNewName('');
    setShowCreate(false);
    setCreating(false);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to Collection</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : collections.length === 0 && !showCreate ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No collections yet</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.7}>
                <Text style={styles.createLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {collections.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.row}
                  onPress={() => handleToggle(c.id, c.contains_recipe)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={c.contains_recipe ? 'check-square-o' : 'square-o'}
                    size={20}
                    color={c.contains_recipe ? colors.primary : colors.textSecondary}
                  />
                  <Text style={styles.rowText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showCreate ? (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder="Collection name"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                onSubmitEditing={handleCreate}
              />
              <View style={styles.createButtons}>
                <TouchableOpacity
                  style={[styles.addButton, (!newName.trim() || creating) && styles.buttonDisabled]}
                  onPress={handleCreate}
                  disabled={!newName.trim() || creating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>
                    {creating ? '...' : 'Add'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : collections.length > 0 ? (
            <TouchableOpacity
              style={styles.newCollectionRow}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus" size={14} color={colors.primary} />
              <Text style={styles.newCollectionText}>New Collection</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  rowText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  createLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  newCollectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  newCollectionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  createForm: {
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  createButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  doneText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
