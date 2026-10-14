import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, getExpiryStatus, PantryItem, usePantry } from '@/store/pantry';

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
}

type RecipeMode = 'quick' | 'custom';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

async function callClaude(prompt: string): Promise<Recipe[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse recipe response.');
  return JSON.parse(match[0]) as Recipe[];
}

function ExpiryPill({ item }: { item: PantryItem }) {
  if (!item.expiryDate) {
    return (
      <View style={[styles.expiryPill, { backgroundColor: AppColors.border }]}>
        <Text style={[styles.expiryPillText, { color: AppColors.textLight }]}>∞</Text>
      </View>
    );
  }
  const days = getDaysUntilExpiry(item.expiryDate);
  const status = getExpiryStatus(item.expiryDate);
  const color = status === 'expired' ? AppColors.expired : status === 'warning' ? AppColors.warning : AppColors.good;
  const bg = status === 'expired' ? AppColors.expiredBg : status === 'warning' ? AppColors.warningBg : AppColors.goodBg;
  const label = days < 0 ? `−${Math.abs(days)}d` : days === 0 ? '0d' : `${days}d`;
  return (
    <View style={[styles.expiryPill, { backgroundColor: bg }]}>
      <Text style={[styles.expiryPillText, { color }]}>{label}</Text>
    </View>
  );
}

function DietaryToggles({
  diets,
  selectedDiets,
  onToggle,
  label,
}: {
  diets: { key: string; label: string }[];
  selectedDiets: Set<string>;
  onToggle: (key: string) => void;
  label: string;
}) {
  return (
    <View style={styles.dietSection}>
      <Text style={styles.sectionTitle2}>{label}</Text>
      <View style={styles.dietGrid}>
        {diets.map((d) => {
          const active = selectedDiets.has(d.key);
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.dietChip, active && styles.dietChipActive]}
              onPress={() => onToggle(d.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              aria-checked={active}
              activeOpacity={0.7}>
              <Text style={[styles.dietChipText, active && styles.dietChipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RecipeCard({ recipe, index, keyIngredientsLabel }: { recipe: Recipe; index: number; keyIngredientsLabel: string }) {
  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeNumber}>
          <Text style={styles.recipeNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.recipeName}>{recipe.name}</Text>
      </View>
      <Text style={styles.recipeDesc}>{recipe.description}</Text>
      <Text style={styles.ingredientsLabel}>{keyIngredientsLabel}</Text>
      <View style={styles.ingredientsList}>
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientChip}>
            <Text style={styles.ingredientText}>{ing}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RecipesScreen() {
  const { items } = usePantry();
  const { t } = useI18n();

  const [mode, setMode] = useState<RecipeMode>('quick');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<'unavailable' | 'emptyPantry' | 'noIngredients' | 'network' | null>(null);
  const errorText = error ? {
    unavailable: t.recipesUnavailable, emptyPantry: t.recipesEmptyPantryMsg,
    noIngredients: t.recipesCustomNoIngredients, network: t.recipesNetworkError,
  }[error] : '';

  // Custom mode state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extraIngredients, setExtraIngredients] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState('');
  const [selectedDiets, setSelectedDiets] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const extraInputRef = useRef<TextInput>(null);

  const DIETS: { key: string; label: string; promptLabel: string }[] = [
    { key: 'vegetarian',  label: t.dietLabels.vegetarian,  promptLabel: 'Vegetarian' },
    { key: 'vegan',       label: t.dietLabels.vegan,        promptLabel: 'Vegan' },
    { key: 'pescatarian', label: t.dietLabels.pescatarian,  promptLabel: 'Pescatarian' },
    { key: 'glutenFree',  label: t.dietLabels.glutenFree,   promptLabel: 'Gluten Free' },
    { key: 'lactoseFree', label: t.dietLabels.lactoseFree,  promptLabel: 'Lactose Free' },
    { key: 'dairyFree',   label: t.dietLabels.dairyFree,    promptLabel: 'Dairy Free' },
    { key: 'eggFree',     label: t.dietLabels.eggFree,      promptLabel: 'Egg Free' },
    { key: 'nutFree',     label: t.dietLabels.nutFree,      promptLabel: 'Nut Free' },
    { key: 'lowCarb',     label: t.dietLabels.lowCarb,      promptLabel: 'Low Carb' },
    { key: 'keto',        label: t.dietLabels.keto,         promptLabel: 'Keto' },
    { key: 'halal',       label: t.dietLabels.halal,        promptLabel: 'Halal' },
    { key: 'kosher',      label: t.dietLabels.kosher,       promptLabel: 'Kosher' },
  ];

  function toggleDiet(key: string) {
    setSelectedDiets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildDietLine(): string {
    const active = DIETS.filter((d) => selectedDiets.has(d.key)).map((d) => d.promptLabel);
    return active.length > 0 ? `\nDietary restrictions: ${active.join(', ')}.` : '';
  }

  const sortedItems = [...items].sort((a, b) => {
    const dA = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : Infinity;
    const dB = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : Infinity;
    return dA - dB;
  });

  function switchMode(next: RecipeMode) {
    if (loading) return;
    setError(null);
    setMode(next);
    setRecipes([]);
    setFetched(false);
    if (next === 'custom' && selectedIds.size === 0 && items.length > 0) {
      // Pre-select all items on first switch to custom
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function addExtraIngredient() {
    const val = extraInput.trim();
    if (!val) return;
    setExtraIngredients((prev) => [...prev, val]);
    setExtraInput('');
    extraInputRef.current?.focus();
  }

  function removeExtraIngredient(idx: number) {
    setExtraIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function getRecipes() {
    if (loading) return;
    setError(null);
    if (!ANTHROPIC_API_KEY) {
      setError('unavailable');
      return;
    }

    let prompt = '';

    if (mode === 'quick') {
      if (items.length === 0) {
        setError('emptyPantry');
        return;
      }
      const urgentItems = sortedItems.filter((i) => i.expiryDate).slice(0, 12);
      const stapleItems = sortedItems.filter((i) => !i.expiryDate);

      const pantryList = [
        ...urgentItems.map((i) => {
          const days = getDaysUntilExpiry(i.expiryDate!);
          const urgency =
            days < 0 ? `(${t.recipesExpired})` : days === 0 ? `(${t.recipesExpiresToday})` : `(${t.recipesExpiresIn(days)})`;
          return `- ${i.name} ${urgency}`;
        }),
        ...(stapleItems.length > 0 ? [`\nAlways available staples: ${stapleItems.map((i) => i.name).join(', ')}`] : []),
      ].join('\n');

      prompt = `You are a helpful cooking assistant focused on reducing food waste. Respond in ${t.languageName}.

Here are the items in my pantry, sorted by urgency (items expiring soonest are first):

${pantryList}
${buildDietLine()}
Suggest 2-3 recipes that use these ingredients, prioritising items that expire soonest.

Return ONLY a JSON array with no extra text, in this exact format:
[
  {
    "name": "Recipe Name",
    "description": "One or two sentence description of the dish.",
    "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
  }
]`;
    } else {
      const selectedPantryItems = sortedItems.filter((i) => selectedIds.has(i.id));
      const allIngredients = [
        ...selectedPantryItems
          .filter((i) => i.expiryDate)
          .map((i) => {
            const days = getDaysUntilExpiry(i.expiryDate!);
            const urgency =
              days < 0 ? `(${t.recipesExpired})` : days === 0 ? `(${t.recipesExpiresToday})` : `(${t.recipesExpiresIn(days)})`;
            return `- ${i.name} ${urgency}`;
          }),
        ...selectedPantryItems
          .filter((i) => !i.expiryDate)
          .map((i) => `- ${i.name} (always available staple)`),
        ...extraIngredients.map((e) => `- ${e}`),
      ];

      if (allIngredients.length === 0) {
        setError('noIngredients');
        return;
      }

      const notesLine = notes.trim() ? `\nAdditional notes: ${notes.trim()}` : '';

      prompt = `You are a helpful cooking assistant. Respond in ${t.languageName}.

I want recipe ideas using the following ingredients:

${allIngredients.join('\n')}
${buildDietLine()}${notesLine}

Suggest 2-3 recipes that make good use of these ingredients.

Return ONLY a JSON array with no extra text, in this exact format:
[
  {
    "name": "Recipe Name",
    "description": "One or two sentence description of the dish.",
    "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
  }
]`;
    }

    setLoading(true);
    setFetched(false);
    try {
      const result = await callClaude(prompt);
      setRecipes(result);
      setFetched(true);
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.recipesTitle} subtitle={t.recipesSubtitle} />

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'quick' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'quick' }}
          aria-selected={mode === 'quick'}
          disabled={loading}
          onPress={() => switchMode('quick')}
          activeOpacity={0.8}>
          <Text style={[styles.toggleBtnText, mode === 'quick' && styles.toggleBtnTextActive]}>
            {t.recipesModeQuick}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'custom' && styles.toggleBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'custom' }}
          aria-selected={mode === 'custom'}
          disabled={loading}
          onPress={() => switchMode('custom')}
          activeOpacity={0.8}>
          <Text style={[styles.toggleBtnText, mode === 'custom' && styles.toggleBtnTextActive]}>
            {t.recipesModeCustom}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {!ANTHROPIC_API_KEY && (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={20} color={AppColors.primaryDark} />
              <Text style={styles.noticeText}>{t.recipesUnavailable}</Text>
            </View>
          )}

          {/* ── QUICK MODE ── */}
          {mode === 'quick' && (
            <>
              <Text style={styles.intro}>{t.recipesIntro}</Text>
              <DietaryToggles diets={DIETS} selectedDiets={selectedDiets} onToggle={toggleDiet} label={t.recipesDietarySection} />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={getRecipes}
                disabled={loading}
                accessibilityRole="button"
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={AppColors.onPrimary} />
                ) : (
                  <Text style={styles.btnText}>{fetched ? t.recipesRefresh : t.recipesGetIdeas}</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── CUSTOM MODE ── */}
          {mode === 'custom' && (
            <>
              {/* Pantry section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.recipesPantrySection}</Text>
                {items.length > 0 && (
                  <TouchableOpacity style={styles.selectAllTouch} onPress={toggleSelectAll} accessibilityRole="button">
                    <Text style={styles.selectAllBtn}>
                      {allSelected ? t.recipesDeselectAll : t.recipesSelectAll}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptySection}>{t.recipesNoPantryItems}</Text>
              ) : (
                <View style={styles.checkList}>
                  {sortedItems.map((item) => {
                    const checked = selectedIds.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.checkRow, checked && styles.checkRowSelected]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        aria-checked={checked}
                        onPress={() => toggleItem(item.id)}
                        activeOpacity={0.7}>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <ExpiryPill item={item} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Extra ingredients section */}
              <Text style={styles.sectionTitle2}>{t.recipesExtraSection}</Text>
              <View style={styles.extraRow}>
                <TextInput
                  ref={extraInputRef}
                  style={styles.extraInput}
                  value={extraInput}
                  onChangeText={setExtraInput}
                  placeholder={t.recipesExtraPlaceholder}
                  placeholderTextColor={AppColors.textLight}
                  returnKeyType="done"
                  onSubmitEditing={addExtraIngredient}
                />
                <TouchableOpacity style={styles.addBtn} accessibilityRole="button" onPress={addExtraIngredient} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>{t.recipesExtraAdd}</Text>
                </TouchableOpacity>
              </View>
              {extraIngredients.length > 0 && (
                <View style={styles.chipRow}>
                  {extraIngredients.map((ing, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.chip}
                      accessibilityRole="button"
                      accessibilityLabel={t.pantryRemove + ': ' + ing}
                      onPress={() => removeExtraIngredient(idx)}
                      activeOpacity={0.7}>
                      <Text style={styles.chipText}>{ing}</Text>
                      <Text style={styles.chipRemove}>×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Dietary section */}
              <DietaryToggles diets={DIETS} selectedDiets={selectedDiets} onToggle={toggleDiet} label={t.recipesDietarySection} />

              {/* Notes section */}
              <Text style={styles.sectionTitle2}>{t.recipesNotesSection}</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder={t.recipesNotesPlaceholder}
                placeholderTextColor={AppColors.textLight}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={getRecipes}
                disabled={loading}
                accessibilityRole="button"
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={AppColors.onPrimary} />
                ) : (
                  <Text style={styles.btnText}>{fetched ? t.recipesRefresh : t.recipesGetIdeas}</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── SHARED: loading / results / empty state ── */}
          {error && (
            <View style={[styles.notice, { marginTop: 16 }]} accessibilityRole="alert">
              <Ionicons name="information-circle-outline" size={20} color={AppColors.primaryDark} />
              <Text style={styles.noticeText}>{errorText}</Text>
            </View>
          )}
          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={AppColors.primaryDark} />
              <Text style={styles.loadingText}>{t.recipesAsking}</Text>
            </View>
          )}

          {!loading && fetched && recipes.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.recipesNoResult}</Text>
            </View>
          )}

          {!loading && recipes.map((recipe, idx) => (
            <RecipeCard key={idx} recipe={recipe} index={idx} keyIngredientsLabel={t.recipesKeyIngredients} />
          ))}

          {!fetched && !loading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}><Ionicons name="restaurant-outline" size={32} color={AppColors.primaryDark} /></View>
              <Text style={styles.emptyStateText}>
                {mode === 'quick' ? t.recipesEmptyState : t.recipesCustomEmptyState}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: AppColors.surfaceTint, borderRadius: 18, padding: 4 },
  toggleBtn: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: AppColors.white },
  toggleBtnText: { fontSize: 14, fontWeight: '500', color: AppColors.textLight },
  toggleBtnTextActive: { color: AppColors.primaryDark },
  content: { padding: 24, paddingBottom: 32 },
  intro: { fontSize: 15, color: AppColors.textLight, lineHeight: 23, marginBottom: 8 },
  notice: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 18, backgroundColor: AppColors.surfaceTint, marginBottom: 20 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 20, color: AppColors.primaryDark },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3, color: AppColors.text },
  sectionTitle2: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3, color: AppColors.text, marginTop: 24, marginBottom: 14 },
  selectAllTouch: { minHeight: 48, justifyContent: 'center' },
  selectAllBtn: { fontSize: 13, color: AppColors.primaryDark, fontWeight: '500' },
  emptySection: { fontSize: 14, color: AppColors.textLight, marginBottom: 12 },
  checkList: { ...AppStyles.card, overflow: 'hidden', marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border },
  checkRowSelected: { backgroundColor: AppColors.surfaceTint },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: AppColors.textLight, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: AppColors.primary, borderColor: AppColors.primaryDark },
  checkmark: { color: AppColors.onPrimary, fontSize: 13, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 14, color: AppColors.textLight, fontWeight: '400' },
  checkLabelChecked: { color: AppColors.text, fontWeight: '500' },
  expiryPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  expiryPillText: { fontSize: 11, fontWeight: '500' },
  extraRow: { flexDirection: 'row', gap: 8 },
  extraInput: { ...AppStyles.input, flex: 1, minWidth: 0, fontSize: 14 },
  addBtn: { ...AppStyles.button, paddingHorizontal: 16, borderRadius: 16 },
  addBtnText: { ...AppStyles.buttonText, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, backgroundColor: AppColors.surfaceTint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  chipText: { color: AppColors.primaryDark, fontSize: 14, fontWeight: '500', flexShrink: 1 },
  chipRemove: { color: AppColors.primaryDark, fontSize: 20, lineHeight: 22 },
  notesInput: { ...AppStyles.input, minHeight: 112, lineHeight: 22 },
  dietSection: { marginTop: 0 },
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietChip: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 14, minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: AppColors.white },
  dietChipActive: { borderColor: AppColors.accent, backgroundColor: AppColors.primary },
  dietChipText: { fontSize: 13, fontWeight: '500', color: AppColors.textLight },
  dietChipTextActive: { color: AppColors.onPrimary },
  btn: { ...AppStyles.button, marginTop: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...AppStyles.buttonText },
  loadingCard: { ...AppStyles.card, padding: 32, alignItems: 'center', gap: 12, marginTop: 20 },
  loadingText: { color: AppColors.textLight, fontSize: 14 },
  emptyCard: { ...AppStyles.card, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyText: { color: AppColors.textLight, fontSize: 14 },
  recipeCard: { ...AppStyles.card, padding: 20, marginTop: 20 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  recipeNumber: { width: 36, height: 36, borderRadius: 12, backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center' },
  recipeNumberText: { color: AppColors.onPrimary, fontWeight: '500', fontSize: 15 },
  recipeName: { fontSize: 20, fontWeight: '600', letterSpacing: -0.4, color: AppColors.text, flex: 1 },
  recipeDesc: { fontSize: 15, color: AppColors.textLight, lineHeight: 23, marginBottom: 18 },
  ingredientsLabel: { fontSize: 13, fontWeight: '500', color: AppColors.primaryDark, marginBottom: 10 },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: { backgroundColor: AppColors.surfaceTint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  ingredientText: { fontSize: 13, color: AppColors.good, fontWeight: '400' },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyStateIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: AppColors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 22 },
});
