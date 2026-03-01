import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  BackHandler,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { convertIngredient, formatQuantity, type UnitSystem } from '@/lib/unit-conversion';
import StarRating from '@/components/ui/StarRating';
import { colors, spacing, typography, radii, fontFamily } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Recipe {
  id: string;
  title: string;
}

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  ingredient_name: string;
  notes: string | null;
  order_index: number;
}

interface Props {
  recipe: Recipe;
  ingredients: Ingredient[];
  steps: string[];
  onDismiss: () => void;
  onRatingSubmit: (rating: number, notes: string) => Promise<void>;
}

type Tab = 'steps' | 'ingredients';

export default function CookingMode({ recipe, ingredients, steps, onDismiss, onRatingSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('steps');
  const [showCompletion, setShowCompletion] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  useEffect(() => {
    activateKeepAwakeAsync();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep > 0) {
        Alert.alert('Stop cooking?', '', [
          { text: 'Keep going', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: onDismiss },
        ]);
        return true; // prevent default back navigation
      }
      return false; // allow default back on step 1
    });
    return () => subscription.remove();
  }, [currentStep, onDismiss]);

  function goNext() {
    if (isLastStep) {
      setShowCompletion(true);
    } else {
      setCurrentStep(s => s + 1);
    }
  }

  function goPrev() {
    if (!isFirstStep) setCurrentStep(s => s - 1);
  }

  async function handleSaveFinish() {
    if (rating === 0) {
      onDismiss();
      return;
    }
    setSubmitting(true);
    try {
      await onRatingSubmit(rating, notes.trim());
    } finally {
      setSubmitting(false);
      onDismiss();
    }
  }

  if (showCompletion) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.completionWrap}>
          <Text style={styles.completionHeading}>You cooked it!</Text>
          <Text style={styles.completionTitle}>{recipe.title}</Text>

          <Text style={styles.completionRatingLabel}>How did it turn out?</Text>
          <StarRating rating={rating} size={32} interactive onRate={setRating} />

          <TextInput
            style={styles.completionNotes}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.inkMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.finishButton, submitting && styles.disabledButton]}
            onPress={handleSaveFinish}
            disabled={submitting}
            activeOpacity={0.75}
          >
            <Text style={styles.finishButtonText}>
              {submitting ? 'Saving...' : rating > 0 ? 'Save & Finish' : 'Finish'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={onDismiss} disabled={submitting}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            if (currentStep > 0) {
              Alert.alert('Stop cooking?', '', [
                { text: 'Keep going', style: 'cancel' },
                { text: 'Stop', style: 'destructive', onPress: onDismiss },
              ]);
            } else {
              onDismiss();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.exitButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.stepCounter}>
          {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : '—'}
        </Text>
      </View>

      {/* Segment control */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'steps' && styles.segmentTabActive]}
          onPress={() => setActiveTab('steps')}
        >
          <Text style={[styles.segmentText, activeTab === 'steps' && styles.segmentTextActive]}>
            Steps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'ingredients' && styles.segmentTabActive]}
          onPress={() => setActiveTab('ingredients')}
        >
          <Text style={[styles.segmentText, activeTab === 'ingredients' && styles.segmentTextActive]}>
            Ingredients
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar — only on Steps tab */}
      {activeTab === 'steps' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Body */}
      {activeTab === 'steps' ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.stepContent}
          key={currentStep}
        >
          <Text style={styles.stepLabel}>Step {currentStep + 1}</Text>
          <Text style={styles.stepText}>{steps[currentStep] ?? ''}</Text>
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.ingredientsContent}>
          {/* Unit toggle */}
          <View style={styles.unitToggleRow}>
            <TouchableOpacity
              style={[styles.unitPill, unitSystem === 'metric' && styles.unitPillActive]}
              onPress={() => setUnitSystem('metric')}
            >
              <Text style={[styles.unitPillText, unitSystem === 'metric' && styles.unitPillTextActive]}>
                Metric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitPill, unitSystem === 'imperial' && styles.unitPillActive]}
              onPress={() => setUnitSystem('imperial')}
            >
              <Text style={[styles.unitPillText, unitSystem === 'imperial' && styles.unitPillTextActive]}>
                Imperial
              </Text>
            </TouchableOpacity>
          </View>
          {ingredients.map((ing) => {
            const converted = convertIngredient(ing.quantity, ing.unit ?? '', unitSystem);
            const qty = formatQuantity(converted.quantity);
            const unit = converted.unit ?? '';
            return (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientQty}>
                  {qty}{unit ? ` ${unit}` : ''}
                </Text>
                <Text style={styles.ingredientName}>{ing.ingredient_name}</Text>
                {ing.notes ? <Text style={styles.ingredientNotes}>{ing.notes}</Text> : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {!isFirstStep ? (
          <TouchableOpacity style={styles.prevButton} onPress={goPrev}>
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.prevPlaceholder} />
        )}
        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextButtonText}>{isLastStep ? 'Done' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exitButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonText: {
    fontSize: 28,
    color: colors.inkSecondary,
    lineHeight: 32,
    fontFamily: fontFamily.sans,
  },
  headerTitle: {
    flex: 1,
    ...typography.label,
    color: colors.ink,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  stepCounter: {
    width: 36,
    textAlign: 'right',
    ...typography.meta,
    color: colors.inkMuted,
  },

  // Segment
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm - 1,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    ...typography.label,
    color: colors.inkMuted,
  },
  segmentTextActive: {
    color: colors.ink,
  },

  // Progress bar
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radii.full,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
  },

  // Step body
  body: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  stepLabel: {
    ...typography.meta,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },
  stepText: {
    fontSize: 22,
    fontFamily: fontFamily.sansLight,
    lineHeight: 33,
    color: colors.ink,
    letterSpacing: -0.01 * 22,
  },

  // Ingredients body
  ingredientsContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  unitToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  unitPill: {
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  unitPillText: {
    ...typography.metaSmall,
    color: colors.inkSecondary,
  },
  unitPillTextActive: {
    color: colors.white,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  ingredientQty: {
    ...typography.label,
    color: colors.inkSecondary,
    minWidth: 56,
  },
  ingredientName: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  ingredientNotes: {
    ...typography.bodySmall,
    color: colors.inkMuted,
    width: '100%',
    paddingLeft: 56 + spacing.sm,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  prevPlaceholder: {
    flex: 1,
  },
  prevButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prevButtonText: {
    ...typography.label,
    color: colors.inkSecondary,
  },
  nextButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  nextButtonText: {
    ...typography.label,
    color: colors.white,
  },

  // Completion
  completionWrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 2,
    alignItems: 'center',
  },
  completionHeading: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completionTitle: {
    ...typography.subheading,
    color: colors.inkSecondary,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  completionRatingLabel: {
    ...typography.meta,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  completionNotes: {
    width: '100%',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  finishButton: {
    width: '100%',
    minHeight: 44,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  finishButtonText: {
    ...typography.label,
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  skipButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    ...typography.label,
    color: colors.inkMuted,
  },
});
