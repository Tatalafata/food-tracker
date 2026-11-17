import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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

import DietaryChoices from '@/components/DietaryChoices';
import RecipeDetail from '@/components/RecipeDetail';
import RecipeFacts from '@/components/RecipeFacts';
import { isRecipeBatch, matchesRecipePreferences, Recipe, RecipePreferences, RECIPE_COUNT } from '@/lib/recipes.mjs';
import { equipmentPrompt } from '@/lib/kitchen-equipment';
import { recipeAreaPrompt } from '@/lib/recipe-area';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { dietaryPrompt, useDietaryPreferences } from '@/store/dietary-preferences';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { getDaysUntilExpiry, getExpiryStatus, PantryItem, usePantry } from '@/store/pantry';
import { planningCopy } from '@/store/planning-copy';
import { recipeBookCopy } from '@/store/recipe-book-copy';


type RecipeMode = 'quick' | 'custom';
type RecipeError = 'unavailable' | 'emptyPantry' | 'noIngredients' | 'network' | 'limit' | 'credits' | 'quality' | 'offline' | 'key' | 'model';

const apiUrl = process.env.EXPO_PUBLIC_RECIPES_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:3001' : '');
const isLocalApi = /^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/.test(apiUrl);
const RECIPES_API_URL = Platform.OS !== 'web' && isLocalApi ? '' : apiUrl;

async function fetchRecipes(prompt: string, preferences: RecipePreferences): Promise<Recipe[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 80000);
  try {
    const response = await fetch(RECIPES_API_URL.replace(/\/$/, '') + '/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, preferences }),
      signal: controller.signal,
    }).catch(() => { throw new Error(isLocalApi ? 'offline' : 'network'); });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      if (response.status === 402) throw new Error('credits');
      if (response.status === 429) throw new Error('limit');
      if (failure.error === 'not_configured') throw new Error('key');
      if (failure.error === 'model_unavailable') throw new Error('model');
      if (failure.error === 'invalid_response') throw new Error('quality');
      throw new Error('network');
    }
    const data = await response.json();
    if (!isRecipeBatch(data.recipes) || !matchesRecipePreferences(data.recipes, preferences)) throw new Error('quality');
    return data.recipes;
  } finally {
    clearTimeout(timer);
  }
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

function CookingPreferences({ preferences, onToggle, disabled }: { preferences: RecipePreferences; onToggle: (key: keyof RecipePreferences) => void; disabled: boolean }) {
  const { t } = useI18n();
  const options: { key: keyof RecipePreferences; label: string; icon: 'leaf-outline' | 'time-outline' }[] = [
    { key: 'easy', label: t.recipesEasyFilter, icon: 'leaf-outline' },
    { key: 'quick', label: t.recipesQuickFilter, icon: 'time-outline' },
  ];
  return (
    <View style={styles.cookingSection}>
      <Text style={styles.sectionTitle}>{t.recipesCookingSection}</Text>
      <Text style={styles.cookingHint}>{t.recipesCookingHint}</Text>
      <View style={styles.dietGrid}>
        {options.map(option => (
          <TouchableOpacity key={option.key} style={[styles.cookingChip, preferences[option.key] && styles.cookingChipActive]} disabled={disabled}
            accessibilityRole="checkbox" accessibilityLabel={option.label} accessibilityState={{ checked: preferences[option.key], disabled }} aria-checked={preferences[option.key]}
            onPress={() => onToggle(option.key)} activeOpacity={0.7}>
            <Ionicons name={preferences[option.key] ? 'checkmark-circle-outline' : option.icon} size={18} color={AppColors.avocadoText} />
            <Text style={styles.cookingChipText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function RecipeCard({ recipe, index, keyIngredientsLabel, onPress }: { recipe: Recipe; index: number; keyIngredientsLabel: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={recipe.name} activeOpacity={0.8}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeNumber}>
          <Text style={styles.recipeNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.recipeName}>{recipe.name}</Text>
      </View>
      <RecipeFacts recipe={recipe} />
      <Text style={styles.recipeDesc}>{recipe.description}</Text>
      <Text style={styles.ingredientsLabel}>{keyIngredientsLabel}</Text>
      <View style={styles.ingredientsList}>
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientChip}>
            <Text style={styles.ingredientText}>{ing.name}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const { items } = usePantry();
  const { language, t } = useI18n();
  const { custom, defaultIds, ready: dietaryReady } = useDietaryPreferences();
  const { equipment, area, loading: kitchenLoading } = useKitchen();
  const copy = planningCopy[language];

  const [mode, setMode] = useState<RecipeMode>('quick');
  const [result, setResult] = useState<{ recipes: Recipe[]; context: string } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RecipeError | null>(null);
  const errorMessages: Record<RecipeError, string> = {
    unavailable: t.recipesUnavailable, emptyPantry: copy.usableIngredients,
    noIngredients: t.recipesCustomNoIngredients, network: t.recipesNetworkError, limit: t.recipesLimit, credits: t.recipesCredits, quality: t.recipesQualityError,
    offline: copy.apiOffline, key: copy.apiKey, model: copy.apiModel,
  };
  const errorText = error ? errorMessages[error] : '';

  // Custom mode state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [extraIngredients, setExtraIngredients] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState('');
  const [dietSelection, setDietSelection] = useState<Set<string> | null>(null);
  const [notes, setNotes] = useState('');
  const [preferences, setPreferences] = useState<RecipePreferences>({ easy: false, quick: false });
  const extraInputRef = useRef<TextInput>(null);

  const selectedDiets = dietSelection ?? new Set(defaultIds);
  const dietLine = dietaryPrompt(selectedDiets, custom);
  const kitchenContext = equipmentPrompt(equipment) + recipeAreaPrompt(area);
  const recipeContext = dietLine + kitchenContext;
  const visibleResult = result?.context === recipeContext ? result : null;
  const fetched = visibleResult !== null;
  const recipes = visibleResult?.recipes ?? [];
  const generationDisabled = loading || !dietaryReady || kitchenLoading;

  useFocusEffect(useCallback(() => () => setDietSelection(null), []));

  function toggleDiet(key: string) {
    if (loading) return;
    clearResults();
    setDietSelection((previous) => {
      const next = new Set(previous ?? defaultIds);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearResults() {
    setResult(null);
    setError(null);
  }

  function toggleCookingPreference(key: keyof RecipePreferences) {
    if (loading) return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    clearResults();
  }

  const sortedItems = items.filter((item) => getDaysUntilExpiry(item.expiryDate) >= 0).sort((a, b) => {
    const dA = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : Infinity;
    const dB = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : Infinity;
    return dA - dB;
  });

  function switchMode(next: RecipeMode) {
    if (loading) return;
    clearResults();
    setMode(next);
    if (next === 'custom' && selectedIds.size === 0 && sortedItems.length > 0) {
      // Pre-select all items on first switch to custom
      setSelectedIds(new Set(sortedItems.map((i) => i.id)));
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
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map((i) => i.id)));
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
    if (generationDisabled) return;
    setError(null);
    if (!RECIPES_API_URL) {
      setError('unavailable');
      return;
    }

    const usableItems = sortedItems.filter((item) => getDaysUntilExpiry(item.expiryDate) >= 0);
    let prompt = '';

    if (mode === 'quick') {
      if (usableItems.length === 0) {
        setError('emptyPantry');
        return;
      }
      const urgentItems = usableItems.filter((i) => i.expiryDate).slice(0, 12);
      const stapleItems = usableItems.filter((i) => !i.expiryDate);

      const pantryList = [
        ...urgentItems.map((i) => {
          const days = getDaysUntilExpiry(i.expiryDate!);
          const urgency =
            days === 0 ? `(${t.recipesExpiresToday})` : `(${t.recipesExpiresIn(days)})`;
          return `- ${i.name} ${urgency}`;
        }),
        ...(stapleItems.length > 0 ? [`\nAlways available staples: ${stapleItems.map((i) => i.name).join(', ')}`] : []),
      ].join('\n');

      prompt = `You are a helpful cooking assistant focused on reducing food waste. Respond in ${t.languageName}.

Here are the items in my pantry, sorted by urgency (items expiring soonest are first):

${pantryList}
${dietLine}
Suggest exactly ${RECIPE_COUNT} distinct recipes that use these ingredients, prioritising items that expire soonest. Use different subsets of ingredients for variety rather than forcing all ingredients into every dish.

Return complete recipes for one person with quantified ingredients and ordered preparation steps, matching the required JSON schema.`;
    } else {
      const selectedPantryItems = usableItems.filter((i) => selectedIds.has(i.id));
      const allIngredients = [
        ...selectedPantryItems
          .filter((i) => i.expiryDate)
          .map((i) => {
            const days = getDaysUntilExpiry(i.expiryDate!);
            const urgency =
              days === 0 ? `(${t.recipesExpiresToday})` : `(${t.recipesExpiresIn(days)})`;
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
${dietLine}${notesLine}

Suggest exactly ${RECIPE_COUNT} distinct recipes that make good use of these ingredients. Use different subsets of ingredients and preparation methods for variety.

Return complete recipes for one person with quantified ingredients and ordered preparation steps, matching the required JSON schema.`;
    }

    setLoading(true);
    setResult(null);
    try {
      const suggestions = await fetchRecipes(prompt + kitchenContext, preferences);
      setResult({ recipes: suggestions, context: recipeContext });
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : '';
      setError(Object.prototype.hasOwnProperty.call(errorMessages, reason) ? reason as RecipeError : 'network');
    } finally {
      setLoading(false);
    }
  }

  const allSelected = sortedItems.length > 0 && sortedItems.every((item) => selectedIds.has(item.id));
  const dietaryChoices = (
    <DietaryChoices
      title={t.recipesDietarySection}
      hint={t.dietary.usage}
      selected={selectedDiets}
      onToggle={toggleDiet}
      onAdd={toggleDiet}
      disabled={loading}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.recipesTitle} subtitle={t.recipesSubtitle} action={(
        <TouchableOpacity
          style={[AppStyles.iconButton, styles.bookButton]}
          accessibilityRole="button"
          accessibilityLabel={recipeBookCopy[language].title}
          onPress={() => router.push('/recipe-book')}>
          <Ionicons name="book-outline" size={23} color={AppColors.avocadoText} />
        </TouchableOpacity>
      )} />

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

          {!RECIPES_API_URL && (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={20} color={AppColors.primaryDark} />
              <Text style={styles.noticeText}>{t.recipesUnavailable}</Text>
            </View>
          )}

          {/* ── QUICK MODE ── */}
          {mode === 'quick' && (
            <>
              <Text style={styles.intro}>{t.recipesIntro}</Text>
              {dietaryChoices}
              <CookingPreferences preferences={preferences} onToggle={toggleCookingPreference} disabled={loading} />
              <TouchableOpacity
                style={[styles.btn, generationDisabled && styles.btnDisabled]}
                onPress={getRecipes}
                disabled={generationDisabled}
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
                {sortedItems.length > 0 && (
                  <TouchableOpacity style={styles.selectAllTouch} onPress={toggleSelectAll} accessibilityRole="button">
                    <Text style={styles.selectAllBtn}>
                      {allSelected ? t.recipesDeselectAll : t.recipesSelectAll}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {sortedItems.length === 0 ? (
                <Text style={styles.emptySection}>{copy.noUsableItems}</Text>
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
              {dietaryChoices}
              <CookingPreferences preferences={preferences} onToggle={toggleCookingPreference} disabled={loading} />

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
                style={[styles.btn, generationDisabled && styles.btnDisabled]}
                onPress={getRecipes}
                disabled={generationDisabled}
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

          {!loading && recipes.length > 0 && <Text style={styles.sectionTitle2} accessibilityRole="header">{t.recipesResultCount(recipes.length)}</Text>}
          {!loading && recipes.map((recipe, idx) => (
            <RecipeCard key={idx} recipe={recipe} index={idx} keyIngredientsLabel={t.recipeOpen} onPress={() => setSelectedRecipe(recipe)} />
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
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onOpenCalendar={(day) => {
            setSelectedRecipe(null);
            router.navigate({ pathname: '/calendar', params: { day, focus: String(Date.now()) } });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bookButton: { borderRadius: 24 },
  toggleRow: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: AppColors.surfaceTint, borderRadius: 18, padding: 4 },
  toggleBtn: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: AppColors.limeTint },
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
  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cookingSection: { marginTop: 24, padding: 16, borderRadius: 22, backgroundColor: AppColors.limeTint, borderWidth: 1, borderColor: AppColors.limeBorder },
  cookingHint: { fontSize: 13, lineHeight: 20, color: AppColors.avocadoText, marginTop: 8, marginBottom: 14 },
  cookingChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderWidth: 1, borderColor: AppColors.limeBorder, backgroundColor: AppColors.background, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, maxWidth: '100%' },
  cookingChipActive: { backgroundColor: AppColors.avocado, borderColor: AppColors.avocadoText },
  cookingChipText: { fontSize: 13, fontWeight: '500', color: AppColors.avocadoText, flexShrink: 1 },
  btn: { ...AppStyles.button, backgroundColor: AppColors.avocado, marginTop: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...AppStyles.buttonText, color: AppColors.avocadoText },
  loadingCard: { ...AppStyles.card, padding: 32, alignItems: 'center', gap: 12, marginTop: 20 },
  loadingText: { color: AppColors.textLight, fontSize: 14 },
  emptyCard: { ...AppStyles.card, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyText: { color: AppColors.textLight, fontSize: 14 },
  recipeCard: { ...AppStyles.card, backgroundColor: AppColors.surface, borderColor: AppColors.limeBorder, padding: 20, marginTop: 16 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  recipeNumber: { width: 36, height: 36, borderRadius: 12, backgroundColor: AppColors.avocado, justifyContent: 'center', alignItems: 'center' },
  recipeNumberText: { color: AppColors.avocadoText, fontWeight: '500', fontSize: 15 },
  recipeName: { fontSize: 20, fontWeight: '600', letterSpacing: -0.4, color: AppColors.text, flex: 1 },
  recipeDesc: { fontSize: 15, color: AppColors.textLight, lineHeight: 23, marginBottom: 18 },
  ingredientsLabel: { fontSize: 13, fontWeight: '500', color: AppColors.primaryDark, marginBottom: 10 },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: { backgroundColor: AppColors.limeTint, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  ingredientText: { fontSize: 13, color: AppColors.good, fontWeight: '400' },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyStateIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 22 },
});
