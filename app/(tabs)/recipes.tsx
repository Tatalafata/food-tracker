import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
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
      next.has(key) ? next.delete(key) : next.add(key);
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
      next.has(id) ? next.delete(id) : next.add(id);
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
    if (!ANTHROPIC_API_KEY) {
      Alert.alert(t.recipesApiKeyTitle, t.recipesApiKeyMsg);
      return;
    }

    let prompt = '';

    if (mode === 'quick') {
      if (items.length === 0) {
        Alert.alert(t.recipesEmptyPantryTitle, t.recipesEmptyPantryMsg);
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
        Alert.alert(t.recipesErrorTitle, t.recipesCustomNoIngredients);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(t.recipesErrorTitle, `Could not fetch recipes.\n\n${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.recipesTitle}</Text>
        <Text style={styles.subtitle}>{t.recipesSubtitle}</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'quick' && styles.toggleBtnActive]}
          onPress={() => switchMode('quick')}
          activeOpacity={0.8}>
          <Text style={[styles.toggleBtnText, mode === 'quick' && styles.toggleBtnTextActive]}>
            {t.recipesModeQuick}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'custom' && styles.toggleBtnActive]}
          onPress={() => switchMode('custom')}
          activeOpacity={0.8}>
          <Text style={[styles.toggleBtnText, mode === 'custom' && styles.toggleBtnTextActive]}>
            {t.recipesModeCustom}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── QUICK MODE ── */}
          {mode === 'quick' && (
            <>
              <Text style={styles.intro}>{t.recipesIntro}</Text>
              <DietaryToggles diets={DIETS} selectedDiets={selectedDiets} onToggle={toggleDiet} label={t.recipesDietarySection} />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={getRecipes}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
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
                  <TouchableOpacity onPress={toggleSelectAll}>
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
                <TouchableOpacity style={styles.addBtn} onPress={addExtraIngredient} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>{t.recipesExtraAdd}</Text>
                </TouchableOpacity>
              </View>
              {extraIngredients.length > 0 && (
                <View style={styles.chipRow}>
                  {extraIngredients.map((ing, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.chip}
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
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.btnText}>{fetched ? t.recipesRefresh : t.recipesGetIdeas}</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── SHARED: loading / results / empty state ── */}
          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={AppColors.primary} />
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
              <Text style={styles.emptyStateIcon}>🍳</Text>
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
  container: { flex: 1, backgroundColor: AppColors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary },
  title: { fontSize: 24, fontWeight: '700', color: AppColors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Mode toggle
  toggleRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: AppColors.border,
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: AppColors.primary },
  toggleBtnText: { fontSize: 14, fontWeight: '600', color: AppColors.textLight },
  toggleBtnTextActive: { color: AppColors.white },

  content: { padding: 16, paddingBottom: 48 },
  intro: { fontSize: 14, color: AppColors.textLight, lineHeight: 20, marginBottom: 16 },

  // Custom mode sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.text },
  sectionTitle2: { fontSize: 15, fontWeight: '700', color: AppColors.text, marginTop: 20, marginBottom: 10 },
  selectAllBtn: { fontSize: 13, color: AppColors.primary, fontWeight: '600' },
  emptySection: { fontSize: 14, color: AppColors.textLight, marginBottom: 12 },

  // Checklist
  checkList: { gap: 6, marginBottom: 4 },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: AppColors.white, borderRadius: 10, padding: 12,
    borderWidth: 1.5, borderColor: AppColors.border,
  },
  checkRowSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.goodBg },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: AppColors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  checkmark: { color: AppColors.white, fontSize: 13, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 14, color: AppColors.textLight, fontWeight: '500' },
  checkLabelChecked: { color: AppColors.text, fontWeight: '600' },
  expiryPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  expiryPillText: { fontSize: 11, fontWeight: '700' },

  // Extra ingredients
  extraRow: { flexDirection: 'row', gap: 8 },
  extraInput: {
    flex: 1, borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: AppColors.text, backgroundColor: AppColors.white,
  },
  addBtn: {
    backgroundColor: AppColors.primary, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: AppColors.white, fontWeight: '700', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: AppColors.primary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { color: AppColors.white, fontSize: 13, fontWeight: '600' },
  chipRemove: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 16 },

  // Notes
  notesInput: {
    borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: AppColors.text, backgroundColor: AppColors.white,
    minHeight: 90,
  },

  // Dietary toggles
  dietSection: { marginTop: 4 },
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  dietChip: {
    borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: AppColors.white,
  },
  dietChipActive: { borderColor: AppColors.primary, backgroundColor: AppColors.primary },
  dietChipText: { fontSize: 13, fontWeight: '600', color: AppColors.textLight },
  dietChipTextActive: { color: AppColors.white },

  // Button
  btn: { backgroundColor: AppColors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },

  // Results
  loadingCard: { backgroundColor: AppColors.white, borderRadius: 12, padding: 32, alignItems: 'center', gap: 12, marginTop: 16 },
  loadingText: { color: AppColors.textLight, fontSize: 14 },
  emptyCard: { backgroundColor: AppColors.white, borderRadius: 12, padding: 24, alignItems: 'center', marginTop: 16 },
  emptyText: { color: AppColors.textLight, fontSize: 14 },
  recipeCard: {
    backgroundColor: AppColors.white, borderRadius: 14, padding: 18, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  recipeNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center' },
  recipeNumberText: { color: AppColors.white, fontWeight: '700', fontSize: 15 },
  recipeName: { fontSize: 17, fontWeight: '700', color: AppColors.text, flex: 1 },
  recipeDesc: { fontSize: 14, color: AppColors.textLight, lineHeight: 20, marginBottom: 14 },
  ingredientsLabel: { fontSize: 12, fontWeight: '700', color: AppColors.primaryLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientChip: { backgroundColor: AppColors.goodBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  ingredientText: { fontSize: 13, color: AppColors.good, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyStateIcon: { fontSize: 52 },
  emptyStateText: { fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
