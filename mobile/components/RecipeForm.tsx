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

export default function RecipeForm({ initialData, onSubmit, submitLabel, loading }: Props) {
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
        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => updateField('title', v)}
          placeholder="Recipe name"
          placeholderTextColor="#999"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => updateField('description', v)}
          placeholder="A short description..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        {/* Time and Servings Row */}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={form.prep_time_minutes}
              onChangeText={(v) => updateField('prep_time_minutes', v)}
              placeholder="15"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>INGREDIENTS</Text>
          <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
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
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.ingredientActions}>
                <TouchableOpacity
                  onPress={() => moveIngredient(i, -1)}
                  disabled={i === 0}
                  style={styles.iconButton}
                >
                  <Text style={[styles.iconText, i === 0 && styles.iconDisabled]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveIngredient(i, 1)}
                  disabled={i === form.ingredients.length - 1}
                  style={styles.iconButton}
                >
                  <Text style={[styles.iconText, i === form.ingredients.length - 1 && styles.iconDisabled]}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeIngredient(i)}
                  disabled={form.ingredients.length <= 1}
                  style={styles.iconButton}
                >
                  <Text style={[styles.deleteIcon, form.ingredients.length <= 1 && styles.iconDisabled]}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.ingredientBottomRow}>
              <TextInput
                style={[styles.ingredientInput, { flex: 1 }]}
                value={ing.quantity}
                onChangeText={(v) => updateIngredient(i, 'quantity', v)}
                placeholder="Qty"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.ingredientInput, { flex: 1.5 }]}
                value={ing.unit}
                onChangeText={(v) => updateIngredient(i, 'unit', v)}
                placeholder="Unit (cups, g...)"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.ingredientInput, { flex: 2 }]}
                value={ing.notes}
                onChangeText={(v) => updateIngredient(i, 'notes', v)}
                placeholder="Notes"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        ))}

        {/* Instructions */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>PREPARATION</Text>
        <TextInput
          style={[styles.input, styles.instructionsArea]}
          value={form.instructions}
          onChangeText={(v) => updateField('instructions', v)}
          placeholder="Enter each step on a new line..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Saving...' : submitLabel}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20 },

  label: { fontSize: 13, fontWeight: '500', color: '#6B6B6B', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  instructionsArea: { minHeight: 160, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#6B6B6B',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: '#F5F0EA',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  addButtonText: { fontSize: 13, color: '#C8553D', fontWeight: '600' },

  // Ingredients
  ingredientCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EBE4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ingredientTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ingredientBottomRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  ingredientInput: {
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#F0EBE4',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A1A1A',
  },
  ingredientActions: { flexDirection: 'row', gap: 2 },
  iconButton: { padding: 6 },
  iconText: { fontSize: 12, color: '#6B6B6B' },
  iconDisabled: { opacity: 0.25 },
  deleteIcon: { fontSize: 20, color: '#C8553D', lineHeight: 20 },

  // Submit
  submitButton: {
    backgroundColor: '#C8553D',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
