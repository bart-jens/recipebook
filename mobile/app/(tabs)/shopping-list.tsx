import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, animation } from '@/lib/theme';

const VIEW_MODE_KEY = 'grocery_view_mode';

interface ShoppingItem {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_ids: string[];
}

// Merged item for shopping view — groups same ingredient+unit across recipes
interface MergedItem {
  key: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  ids: string[];
  recipe_ids: string[];
  is_checked: boolean;
}

function GroceryCheckbox({ checked }: { checked: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (checked) {
      scale.value = withSpring(animation.checkPopScale, animation.springBounce);
      setTimeout(() => {
        scale.value = withSpring(1, animation.springBounce);
      }, 150);
    }
  }, [checked]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        animStyle,
      ]}
    >
      {checked && (
        <View style={styles.checkmark}>
          <FontAwesome name="check" size={9} color={colors.white} />
        </View>
      )}
    </Animated.View>
  );
}

// Merge unchecked or checked items by ingredient name + unit, summing quantities
function mergeByIngredient(itemsList: ShoppingItem[]): MergedItem[] {
  const map = new Map<string, MergedItem>();
  for (const item of itemsList) {
    const key = `${item.ingredient_name.toLowerCase().trim()}|${item.unit?.toLowerCase().trim() ?? ''}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      if (existing.quantity !== null || item.quantity !== null) {
        existing.quantity = (existing.quantity ?? 0) + (item.quantity ?? 0);
      }
      existing.ids.push(item.id);
      existing.recipe_ids = Array.from(new Set([...existing.recipe_ids, ...(item.recipe_ids || [])]));
    } else {
      map.set(key, {
        key,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        ids: [item.id],
        recipe_ids: item.recipe_ids || [],
        is_checked: item.is_checked,
      });
    }
  }
  return Array.from(map.values());
}

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [recipeTitles, setRecipeTitles] = useState<Record<string, string>>({});
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkedExpanded, setCheckedExpanded] = useState(false);
  const [viewMode, setViewModeState] = useState<'planning' | 'shopping'>('planning');

  // Load persisted view mode on mount
  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_KEY).then((val) => {
      if (val === 'planning' || val === 'shopping') setViewModeState(val);
    });
  }, []);

  const setViewMode = (mode: 'planning' | 'shopping') => {
    setViewModeState(mode);
    AsyncStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const fetchList = useCallback(async () => {
    if (!user) return;

    let { data: list } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle();

    if (!list) {
      const { data: newList } = await supabase
        .from('shopping_lists')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      list = newList;
    }

    if (!list) { setLoading(false); return; }
    setListId(list.id);

    const { data: itemData } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', list.id)
      .order('is_checked')
      .order('created_at');

    const fetchedItems = itemData || [];
    setItems(fetchedItems);

    const allIds = fetchedItems.flatMap((i) => i.recipe_ids || []);
    const uniqueIds = Array.from(new Set(allIds));
    if (uniqueIds.length > 0) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title')
        .in('id', uniqueIds);
      setRecipeTitles(
        Object.fromEntries((recipes || []).map((r) => [r.id, r.title]))
      );
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList])
  );

  // Planning mode: toggle a single item
  const toggleItem = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_checked: !i.is_checked } : i))
    );
    const item = items.find((i) => i.id === itemId);
    if (item) {
      await supabase
        .from('shopping_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', itemId);
    }
  };

  // Shopping mode: toggle all underlying rows for a merged item
  const toggleMerged = async (mergedItem: MergedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newChecked = !mergedItem.is_checked;
    setItems((prev) =>
      prev.map((i) => mergedItem.ids.includes(i.id) ? { ...i, is_checked: newChecked } : i)
    );
    await supabase
      .from('shopping_list_items')
      .update({ is_checked: newChecked })
      .in('id', mergedItem.ids);
  };

  const addItem = async () => {
    const name = newItem.trim();
    if (!name || !listId) return;
    setNewItem('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { data } = await supabase
      .from('shopping_list_items')
      .insert({ shopping_list_id: listId, ingredient_name: name })
      .select('*')
      .single();

    if (data) {
      setItems((prev) => [...prev, data]);
    }
  };

  // Planning mode: delete a single item
  const deleteItem = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from('shopping_list_items').delete().eq('id', itemId);
  };

  // Shopping mode: delete all underlying rows for a merged item
  const deleteMerged = async (ids: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    await supabase.from('shopping_list_items').delete().in('id', ids);
  };

  const clearChecked = async () => {
    if (!listId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setItems((prev) => prev.filter((i) => !i.is_checked));
    setCheckedExpanded(false);
    await supabase.rpc('clear_checked_items', { p_shopping_list_id: listId });
  };

  const clearAll = () => {
    if (!listId) return;
    Alert.alert('Clear all items?', 'This will remove everything from your grocery list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setItems([]);
          await supabase.from('shopping_list_items').delete().eq('shopping_list_id', listId);
        },
      },
    ]);
  };

  const formatQty = (qty: number | null) => {
    if (qty === null) return '';
    if (qty === Math.floor(qty)) return String(qty);
    return qty.toFixed(1);
  };

  // Returns a muted attribution string for shopping view, or null if none
  function recipeAttribution(recipeIds: string[]): string | null {
    if (!recipeIds || recipeIds.length === 0) return null;
    const titles = recipeIds.map((id) => recipeTitles[id]).filter(Boolean);
    if (titles.length === 0) return null;
    return titles.join(' · ');
  }

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  // Planning view: group unchecked by recipe source
  function groupByRecipe(itemsList: ShoppingItem[]) {
    const groups: { recipeId: string | null; title: string | null; items: ShoppingItem[] }[] = [];
    const noRecipe: ShoppingItem[] = [];
    const recipeMap = new Map<string, ShoppingItem[]>();

    for (const item of itemsList) {
      if (!item.recipe_ids || item.recipe_ids.length === 0) {
        noRecipe.push(item);
      } else {
        const rid = item.recipe_ids[0];
        if (!recipeMap.has(rid)) recipeMap.set(rid, []);
        recipeMap.get(rid)!.push(item);
      }
    }

    if (noRecipe.length > 0) {
      groups.push({ recipeId: null, title: null, items: noRecipe });
    }

    Array.from(recipeMap.entries()).forEach(([rid, recipeItems]) => {
      groups.push({ recipeId: rid, title: recipeTitles[rid] || null, items: recipeItems });
    });

    return groups;
  }

  const groups = groupByRecipe(unchecked);
  const mergedUnchecked = mergeByIngredient(unchecked);
  const mergedChecked = mergeByIngredient(checked);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Grocery List</Text>
          <View style={styles.headerRight}>
            {/* Planning / Shopping toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity onPress={() => setViewMode('planning')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={[styles.toggleOption, viewMode === 'planning' && styles.toggleOptionActive]}>
                  Planning
                </Text>
              </TouchableOpacity>
              <Text style={styles.toggleSeparator}>·</Text>
              <TouchableOpacity onPress={() => setViewMode('shopping')} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={[styles.toggleOption, viewMode === 'shopping' && styles.toggleOptionActive]}>
                  Shopping
                </Text>
              </TouchableOpacity>
            </View>
            {items.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Add item input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            placeholder="Add an item..."
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        {items.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
            <Text style={styles.emptySubtext}>
              Add items above or tap + on recipe ingredients
            </Text>
          </View>
        ) : (
          <>
            {viewMode === 'shopping' ? (
              /* Shopping view — merged by ingredient */
              <View style={styles.groupContainer}>
                {mergedUnchecked.map((mergedItem) => (
                  <Animated.View
                    key={mergedItem.key}
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOut.duration(150)}
                    layout={Layout.springify()}
                  >
                    <Pressable
                      style={styles.itemRow}
                      onPress={() => toggleMerged(mergedItem)}
                      onLongPress={() => deleteMerged(mergedItem.ids)}
                    >
                      <GroceryCheckbox checked={false} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {mergedItem.ingredient_name}
                        </Text>
                        {recipeAttribution(mergedItem.recipe_ids) && (
                          <Text style={styles.itemAttribution} numberOfLines={1}>
                            {recipeAttribution(mergedItem.recipe_ids)}
                          </Text>
                        )}
                      </View>
                      {(mergedItem.quantity !== null || mergedItem.unit) && (
                        <Text style={styles.itemAmount}>
                          {formatQty(mergedItem.quantity)} {mergedItem.unit || ''}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => deleteMerged(mergedItem.ids)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <FontAwesome name="times" size={14} color={colors.inkMuted} />
                      </TouchableOpacity>
                    </Pressable>
                    <View style={styles.dottedSeparator} />
                  </Animated.View>
                ))}
              </View>
            ) : (
              /* Planning view — grouped by recipe */
              groups.map((group, gi) => (
                <View key={group.recipeId ?? `manual-${gi}`} style={styles.groupContainer}>
                  {group.title && (
                    <Text style={styles.groupTitle}>{group.title}</Text>
                  )}
                  {!group.title && group.recipeId === null && groups.length > 1 && (
                    <Text style={styles.groupLabelMono}>Manual</Text>
                  )}
                  {group.items.map((item) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.duration(200)}
                      exiting={FadeOut.duration(150)}
                      layout={Layout.springify()}
                    >
                      <Pressable
                        style={styles.itemRow}
                        onPress={() => toggleItem(item.id)}
                        onLongPress={() => deleteItem(item.id)}
                      >
                        <GroceryCheckbox checked={false} />
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.ingredient_name}
                        </Text>
                        {(item.quantity !== null || item.unit) && (
                          <Text style={styles.itemAmount}>
                            {formatQty(item.quantity)} {item.unit || ''}
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => deleteItem(item.id)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <FontAwesome name="times" size={14} color={colors.inkMuted} />
                        </TouchableOpacity>
                      </Pressable>
                      <View style={styles.dottedSeparator} />
                    </Animated.View>
                  ))}
                </View>
              ))
            )}

            {/* All done message */}
            {unchecked.length === 0 && checked.length > 0 && (
              <View style={styles.allDone}>
                <Text style={styles.allDoneText}>All done!</Text>
              </View>
            )}

            {/* Collapsible checked section */}
            {checked.length > 0 && (
              <View style={styles.checkedSection}>
                <TouchableOpacity
                  style={styles.checkedHeader}
                  onPress={() => setCheckedExpanded(!checkedExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.checkedHeaderText}>
                    Checked ({viewMode === 'shopping' ? mergedChecked.length : checked.length})
                  </Text>
                  <FontAwesome
                    name={checkedExpanded ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={colors.inkMuted}
                  />
                </TouchableOpacity>

                {checkedExpanded && (
                  <View style={styles.checkedContent}>
                    {viewMode === 'shopping' ? (
                      mergedChecked.map((mergedItem) => (
                        <Pressable
                          key={mergedItem.key}
                          style={styles.itemRow}
                          onPress={() => toggleMerged(mergedItem)}
                          onLongPress={() => deleteMerged(mergedItem.ids)}
                        >
                          <GroceryCheckbox checked={true} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.checkedItemName} numberOfLines={1}>
                              {mergedItem.ingredient_name}
                            </Text>
                            {recipeAttribution(mergedItem.recipe_ids) && (
                              <Text style={styles.checkedItemAttribution} numberOfLines={1}>
                                {recipeAttribution(mergedItem.recipe_ids)}
                              </Text>
                            )}
                          </View>
                          {(mergedItem.quantity !== null || mergedItem.unit) && (
                            <Text style={styles.checkedItemAmount}>
                              {formatQty(mergedItem.quantity)} {mergedItem.unit || ''}
                            </Text>
                          )}
                        </Pressable>
                      ))
                    ) : (
                      checked.map((item) => (
                        <Pressable
                          key={item.id}
                          style={styles.itemRow}
                          onPress={() => toggleItem(item.id)}
                          onLongPress={() => deleteItem(item.id)}
                        >
                          <GroceryCheckbox checked={true} />
                          <Text style={styles.checkedItemName} numberOfLines={1}>
                            {item.ingredient_name}
                          </Text>
                          {(item.quantity !== null || item.unit) && (
                            <Text style={styles.checkedItemAmount}>
                              {formatQty(item.quantity)} {item.unit || ''}
                            </Text>
                          )}
                        </Pressable>
                      ))
                    )}
                    <TouchableOpacity onPress={clearChecked} style={styles.clearCheckedButton}>
                      <Text style={styles.clearCheckedText}>Clear all checked</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.pagePadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    ...typography.title,
    color: colors.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Planning / Shopping toggle
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleOption: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  toggleOptionActive: {
    color: colors.ink,
  },
  toggleSeparator: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },

  clearAllText: {
    ...typography.metaSmall,
    color: colors.danger,
  },

  // Input
  inputContainer: {
    paddingHorizontal: spacing.pagePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  input: {
    ...typography.label,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm + 2,
    color: colors.ink,
  },

  // Empty state
  emptyTitle: {
    ...typography.subheading,
    color: colors.inkMuted,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkSecondary,
  },
  emptySubtext: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Groups
  groupContainer: {
    paddingHorizontal: spacing.pagePadding,
    marginBottom: spacing.lg,
  },
  groupTitle: {
    ...typography.subheading,
    color: colors.ink,
    marginBottom: 4,
  },
  groupLabelMono: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginBottom: 4,
  },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },

  // Checkbox
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Item text
  itemName: {
    ...typography.label,
    flex: 1,
    color: colors.ink,
  },
  itemAttribution: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    marginTop: 1,
  },
  itemAmount: {
    ...typography.meta,
    color: colors.inkSecondary,
  },

  // Dotted separator
  dottedSeparator: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dotted' as any,
  },

  // All done
  allDone: { paddingVertical: spacing.xxl, alignItems: 'center' },
  allDoneText: {
    ...typography.subheading,
    color: colors.inkMuted,
  },

  // Checked section
  checkedSection: {
    marginTop: spacing.md,
    marginHorizontal: spacing.pagePadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  checkedHeaderText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  checkedContent: {
    paddingBottom: spacing.sm,
  },
  checkedItemName: {
    ...typography.label,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.accent,
  },
  checkedItemAttribution: {
    ...typography.metaSmall,
    color: colors.inkMuted,
    opacity: 0.6,
    marginTop: 1,
  },
  checkedItemAmount: {
    ...typography.meta,
    color: colors.inkSecondary,
    opacity: 0.4,
  },
  clearCheckedButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  clearCheckedText: {
    ...typography.metaSmall,
    color: colors.danger,
  },
});
