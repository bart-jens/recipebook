import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, radii } from '@/lib/theme';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

export interface IngredientField {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes: string;
}

export interface RecipeFormData {
  title: string;
  description: string;
  instructions: string;
  prep_time_minutes: string;
  cook_time_minutes: string;
  servings: string;
  ingredients: IngredientField[];
}

interface Props {
  initialData?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  submitLabel: string;
  loading?: boolean;
  sourceName?: string | null;
  onSourceNameChange?: (value: string) => void;
  headerContent?: React.ReactNode;
}

const emptyIngredient = (): IngredientField => ({
  ingredient_name: '',
  quantity: '',
  unit: '',
  notes: '',
});

export const defaultFormData: RecipeFormData = {
  title: '',
  description: '',
  instructions: '',
  prep_time_minutes: '',
  cook_time_minutes: '',
  servings: '',
  ingredients: [emptyIngredient()],
};

export default function RecipeForm({ initialData, onSubmit, submitLabel, loading, sourceName, onSourceNameChange, headerContent }: Props) {
  const [form, setForm] = useState<RecipeFormData>(initialData || defaultFormData);

  const updateField = (field: keyof RecipeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateIngredient = (index: number, field: keyof IngredientField, value: string) => {
    setForm((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, emptyIngredient()],
    }));
  };

  const removeIngredient = (index: number) => {
    if (form.ingredients.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const moveIngredient = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= form.ingredients.length) return;
    setForm((prev) => {
      const updated = [...prev.ingredients];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return { ...prev, ingredients: updated };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Required', 'Please enter a recipe title');
      return;
    }
    await onSubmit(form);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {headerContent}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => updateField('title', v)}
          placeholder="Recipe name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => updateField('description', v)}
          placeholder="A short description..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {onSourceNameChange !== undefined && (
          <>
            <Text style={styles.label}>Source</Text>
            <TextInput
              style={styles.input}
              value={sourceName || ''}
              onChangeText={onSourceNameChange}
              placeholder="e.g. The Food Lab, Ottolenghi Simple"
              placeholderTextColor={colors.textMuted}
            />
          </>
        )}

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={form.prep_time_minutes}
              onChangeText={(v) => updateField('prep_time_minutes', v)}
              placeholder="15"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Cook (min)</Text>
            <TextInput
              style={styles.input}
              value={form.cook_time_minutes}
              onChangeText={(v) => updateField('cook_time_minutes', v)}
              placeholder="30"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={form.servings}
              onChangeText={(v) => updateField('servings', v)}
              placeholder="4"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          <TouchableOpacity
            onPress={addIngredient}
            style={styles.addButton}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {form.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientCard}>
            <View style={styles.ingredientTopRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.ingredientInput}
                  value={ing.ingredient_name}
                  onChangeText={(v) => updateIngredient(i, 'ingredient_name', v)}
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.ingredientActions}>
                <IconButton
                  name="chevron-up"
                  onPress={() => moveIngredient(i, -1)}
                  disabled={i === 0}
                  size={12}
                />
                <IconButton
                  name="chevron-down"
                  onPress={() => moveIngredient(i, 1)}
                  disabled={i === form.ingredients.length - 1}
                  size={12}
                />
                <IconButton
                  name="times"
                  onPress={() => removeIngredient(i)}
                  disabled={form.ingredients.length <= 1}
                  color={colors.primary}
                  size={16}
                />
              </View>
            </View>
            <View style={styles.ingredientBottomRow}>
              <TextInput
                style={[styles.ingredientInput, { flex: 1 }]}
                value={ing.quantity}
                onChangeText={(v) => updateIngredient(i, 'quantity', v)}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.ingredientInput, { flex: 1.5 }]}
                value={ing.unit}
                onChangeText={(v) => updateIngredient(i, 'unit', v)}
                placeholder="Unit (cups, g...)"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.ingredientInput, { flex: 2 }]}
                value={ing.notes}
                onChangeText={(v) => updateIngredient(i, 'notes', v)}
                placeholder="Notes"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        ))}

        <View style={styles.preparationHeader}>
          <Text style={styles.sectionTitle}>Preparation</Text>
        </View>
        <TextInput
          style={[styles.input, styles.instructionsArea]}
          value={form.instructions}
          onChangeText={(v) => updateField('instructions', v)}
          placeholder="Enter each step on a new line..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        <View style={styles.submitContainer}>
          <Button
            title={loading ? 'Saving...' : submitLabel}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },

  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  instructionsArea: { minHeight: 160, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  sectionTitleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    flex: 1,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textSecondary,
  },
  preparationHeader: {
    marginTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  addButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  addButtonText: { ...typography.label, color: colors.primary, fontWeight: '600' },

  ingredientCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: spacing.sm,
  },
  ingredientTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ingredientBottomRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ingredientInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: colors.text,
  },
  ingredientActions: { flexDirection: 'row', gap: 2 },

  submitContainer: {
    marginTop: spacing.xxl,
  },
});
