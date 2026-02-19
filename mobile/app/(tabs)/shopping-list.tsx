import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, typography, fontFamily, radii } from '@/lib/theme';

interface ShoppingItem {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_ids: string[];
}

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [recipeTitles, setRecipeTitles] = useState<Record<string, string>>({});
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!user) return;

    // Get or create shopping list
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

    // Fetch recipe titles
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

  const deleteItem = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await supabase.from('shopping_list_items').delete().eq('id', itemId);
  };

  const clearChecked = async () => {
    if (!listId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setItems((prev) => prev.filter((i) => !i.is_checked));
    await supabase.rpc('clear_checked_items', { p_shopping_list_id: listId });
  };

  const clearAll = () => {
    if (!listId) return;
    Alert.alert('Clear all items?', 'This will remove everything from your shopping list.', [
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

  const getAttribution = (recipeIds: string[]) => {
    if (!recipeIds || recipeIds.length === 0) return null;
    const titles = recipeIds.map((id) => recipeTitles[id]).filter(Boolean);
    return titles.length > 0 ? titles.join(', ') : null;
  };

  const unchecked = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const attribution = getAttribution(item.recipe_ids);
    return (
      <Animated.View
        entering={FadeInDown.duration(200)}
        exiting={FadeOut.duration(150)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleItem(item.id)}
          onLongPress={() => deleteItem(item.id)}
          style={styles.itemRow}
        >
          <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
            {item.is_checked && (
              <FontAwesome name="check" size={12} color={colors.background} />
            )}
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemText, item.is_checked && styles.itemTextChecked]}>
              {item.quantity !== null && `${formatQty(item.quantity)} `}
              {item.unit && `${item.unit} `}
              {item.ingredient_name}
            </Text>
            {attribution && (
              <Text style={styles.attributionText} numberOfLines={1}>
                from {attribution}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => deleteItem(item.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesome name="times" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add item input */}
      <View style={styles.inputContainer}>
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
          placeholder="Add an item..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Your shopping list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items above or use &quot;Add to Shopping List&quot; on any recipe
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={
            (checked.length > 0 || unchecked.length > 0) ? (
              <View style={styles.actions}>
                {checked.length > 0 && (
                  <TouchableOpacity onPress={clearChecked} style={styles.actionButton}>
                    <Text style={styles.actionText}>Clear checked ({checked.length})</Text>
                  </TouchableOpacity>
                )}
                {items.length > 0 && (
                  <TouchableOpacity onPress={clearAll} style={styles.actionButtonDanger}>
                    <Text style={styles.actionTextDanger}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontFamily: fontFamily.sansMedium },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  inputContainer: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    fontFamily: fontFamily.sans,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  actionText: { fontSize: 13, color: colors.textSecondary, fontFamily: fontFamily.sansMedium },
  actionButtonDanger: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
  },
  actionTextDanger: { fontSize: 13, color: colors.danger, fontFamily: fontFamily.sansMedium },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemContent: { flex: 1 },
  itemText: { fontSize: 15, color: colors.text, fontFamily: fontFamily.sans },
  itemTextChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
  attributionText: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: fontFamily.sans },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 28 + spacing.md },
});
