import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { Recipe, scaledAmount, formatStep, normalizeStepShares } from '@/lib/recipes.mjs';
import { missingIngredients } from '@/lib/shopping';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { kitchenCopy } from '@/store/kitchen-copy';
import { getExpiryStatus, usePantry } from '@/store/pantry';
import RecipeFacts from '@/components/RecipeFacts';
import { TimerDock } from '@/components/CookingTimers';
import RecipePlanner from '@/components/RecipePlanner';
import { planningCopy } from '@/store/planning-copy';
import { recipeIdentity, useRecipeBook } from '@/store/recipe-book';
import { recipeBookCopy } from '@/store/recipe-book-copy';
import { useTimers } from '@/store/timers';

interface RecipeDetailProps {
  recipe: Recipe;
  initialServings?: number;
  onClose: () => void;
  onOpenCalendar?: (day: string) => void;
  onRemove?: () => Promise<void>;
}

export default function RecipeDetail({ recipe, initialServings = 1, onClose, onOpenCalendar, onRemove }: RecipeDetailProps) {
  const { t, language } = useI18n();
  const { saved, ready, loadError, toggleMark } = useRecipeBook();
  const { items: pantry, loading: pantryLoading, loadError: pantryError } = usePantry();
  const { addToShopping, loading: kitchenLoading, loadError: kitchenError } = useKitchen();
  const { setDockInDetail } = useTimers();
  const book = recipeBookCopy[language];
  const [servings, setServings] = useState(initialServings);
  const [planning, setPlanning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);
  const [markSaving, setMarkSaving] = useState(false);
  const [markError, setMarkError] = useState(false);
  const [addingToShopping, setAddingToShopping] = useState(false);
  const [shoppingFeedback, setShoppingFeedback] = useState<{ text: string; canOpen?: boolean; error?: boolean } | null>(null);
  const copy = planningCopy[language];
  const shopping = kitchenCopy[language];
  const shoppingDisabled = pantryLoading || kitchenLoading || addingToShopping;
  const normalizedRecipe = normalizeStepShares(recipe);
  const identity = recipeIdentity(recipe);
  const entry = saved.find(item => recipeIdentity(item.recipe) === identity);
  const favorite = !!entry?.favoriteAt;
  const cooked = !!entry?.cookedAt;
  const sourceUrl = recipe.wikiPage && 'https://en.wikibooks.org/wiki/Cookbook:' + encodeURIComponent(recipe.wikiPage);

  useEffect(() => {
    setDockInDetail(true);
    return () => setDockInDetail(false);
  }, [setDockInDetail]);

  async function mark(field: 'favoriteAt' | 'cookedAt') {
    if (!ready || markSaving) return;
    setMarkSaving(true);
    setMarkError(false);
    try {
      await toggleMark(recipe, servings, field);
    } catch {
      setMarkError(true);
    } finally {
      setMarkSaving(false);
    }
  }

  async function remove() {
    if (!onRemove || removing) return;
    setRemoving(true);
    setRemoveError(false);
    try {
      await onRemove();
    } catch {
      setRemoveError(true);
    } finally {
      setRemoving(false);
    }
  }

  async function addMissing() {
    if (shoppingDisabled) return;
    if (pantryError || kitchenError) {
      setShoppingFeedback({ text: shopping.loadError, error: true });
      return;
    }
    const available = pantry.filter(item => getExpiryStatus(item.expiryDate) !== 'expired').map(item => item.name);
    const missing = missingIngredients(recipe.ingredients, available, servings, language, t.recipeToTaste);
    if (!missing.length) {
      setShoppingFeedback({ text: shopping.allAvailable });
      return;
    }
    setAddingToShopping(true);
    setShoppingFeedback(null);
    try {
      const added = await addToShopping(missing);
      setShoppingFeedback({ text: added > 0 ? shopping.added(added) : shopping.alreadyListed, canOpen: true });
    } catch {
      setShoppingFeedback({ text: t.saveError, error: true });
    } finally {
      setAddingToShopping(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={() => !removing && onClose()}>
      <SafeAreaView style={AppStyles.screen}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">{recipe.name}</Text>
          <TouchableOpacity
            style={[AppStyles.iconButton, favorite && styles.marked]}
            accessibilityRole="button"
            accessibilityLabel={favorite ? book.removeFavorite : book.addFavorite}
            accessibilityState={{ selected: favorite, disabled: !ready || markSaving }}
            disabled={!ready || markSaving}
            onPress={() => mark('favoriteAt')}>
            <Ionicons name={favorite ? 'star' : 'star-outline'} size={22} color={AppColors.avocadoText} />
          </TouchableOpacity>
          <TouchableOpacity style={AppStyles.iconButton} accessibilityRole="button" accessibilityLabel={t.recipeClose} disabled={removing} onPress={onClose}>
            <Ionicons name="close" size={22} color={AppColors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.scroll} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.description}>{recipe.description}</Text>
            {sourceUrl && (
              <View style={styles.sources}>
                <Text accessibilityRole="link" style={styles.source}
                  onPress={() => void Linking.openURL(sourceUrl).catch(() => {})}>
                  {book.source}
                </Text>
                <Text accessibilityRole="link" style={styles.source}
                  onPress={() => void Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/').catch(() => {})}>
                  CC BY-SA 4.0
                </Text>
              </View>
            )}
            <RecipeFacts recipe={recipe} />
            <View style={styles.servings}>
              <Text style={styles.servingsText} accessibilityLiveRegion="polite">{t.recipeServings(servings)}</Text>
              <TouchableOpacity style={AppStyles.iconButton} disabled={servings === 1 || addingToShopping} accessibilityRole="button" accessibilityLabel={t.recipeFewer} onPress={() => { setShoppingFeedback(null); setServings(n => n - 1); }}>
                <Ionicons name="remove" size={22} color={servings === 1 ? AppColors.border : AppColors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={AppStyles.iconButton} disabled={servings === 12 || addingToShopping} accessibilityRole="button" accessibilityLabel={t.recipeMore} onPress={() => { setShoppingFeedback(null); setServings(n => n + 1); }}>
                <Ionicons name="add" size={22} color={servings === 12 ? AppColors.border : AppColors.primaryDark} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[AppStyles.button, styles.cooked, cooked && styles.marked]}
              accessibilityRole="checkbox"
              accessibilityLabel={book.markCooked}
              accessibilityState={{ checked: cooked, disabled: !ready || markSaving }}
              aria-checked={cooked}
              disabled={!ready || markSaving}
              onPress={() => mark('cookedAt')}>
              <Ionicons name={cooked ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={AppColors.avocadoText} />
              <Text style={AppStyles.buttonText}>{book.markCooked}</Text>
            </TouchableOpacity>
            {(loadError || markError) && <Text accessibilityRole="alert" style={styles.removeText}>{loadError ? book.readError : t.saveError}</Text>}
            {onOpenCalendar && (planning ? (
              <RecipePlanner recipe={recipe} servings={servings} onOpenCalendar={onOpenCalendar} onCancel={() => setPlanning(false)} />
            ) : (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.plan} style={[AppStyles.button, styles.plan]} onPress={() => setPlanning(true)}>
                <Ionicons name="calendar-outline" size={19} color={AppColors.avocadoText} />
                <Text style={AppStyles.buttonText}>{copy.plan}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.section} accessibilityRole="header">{t.recipeIngredients}</Text>
            <View style={styles.shopping}>
              <TouchableOpacity style={[AppStyles.button, styles.shoppingButton, shoppingDisabled && styles.disabled]}
                accessibilityRole="button" accessibilityLabel={shopping.addMissing} disabled={shoppingDisabled} onPress={addMissing}>
                <Ionicons name="cart-outline" size={21} color={AppColors.avocadoText} />
                <Text style={styles.shoppingLabel}>{shopping.addMissing}</Text>
              </TouchableOpacity>
              {shoppingFeedback && (
                <Text accessibilityRole={shoppingFeedback.error ? 'alert' : undefined} accessibilityLiveRegion="polite"
                  style={shoppingFeedback.error ? styles.removeText : styles.shoppingHint}>{shoppingFeedback.text}</Text>
              )}
              {shoppingFeedback?.canOpen && (
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={shopping.viewList} style={styles.shoppingLink}
                  onPress={() => { onClose(); router.push('/shopping-list'); }}>
                  <Text style={styles.shoppingLinkText}>{shopping.viewList}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={AppStyles.card}>
              {recipe.ingredients.map((ingredient, index) => {
                const amount = scaledAmount(ingredient.amount, servings);
                const quantity = amount === null ? t.recipeToTaste : new Intl.NumberFormat(language, { maximumFractionDigits: 3 }).format(amount) + ' ' + ingredient.unit;
                return <View key={index} style={styles.ingredient}><Text style={styles.ingredientName}>{ingredient.name}</Text><Text style={styles.quantity}>{quantity}</Text></View>;
              })}
            </View>
            <Text style={styles.section} accessibilityRole="header">{t.recipePreparation}</Text>
            <Text style={styles.description}>{t.recipeScalingHint}</Text>
            {normalizedRecipe.steps.map((step, index) => <View key={index} style={styles.step}><Text style={styles.number}>{index + 1}</Text><Text style={styles.stepText}>{formatStep(step, recipe.ingredients, servings, language)}</Text></View>)}
            {onRemove && (confirmRemove ? (
              <View style={styles.removePanel}>
                <Text style={styles.description}>{copy.confirmRemove(recipe.name)}</Text>
                {removeError && <Text accessibilityRole="alert" style={styles.removeText}>{t.saveError}</Text>}
                <View style={styles.removeActions}>
                  <TouchableOpacity accessibilityRole="button" disabled={removing} style={AppStyles.button} onPress={() => setConfirmRemove(false)}>
                    <Text style={AppStyles.buttonText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" disabled={removing} style={[AppStyles.button, styles.removeButton]} onPress={remove}>
                    <Text style={[AppStyles.buttonText, styles.removeText]}>{copy.remove}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity accessibilityRole="button" style={[AppStyles.button, styles.removeButton]} onPress={() => setConfirmRemove(true)}>
                <Text style={[AppStyles.buttonText, styles.removeText]}>{copy.removePlan}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
        <TimerDock onLeaveDetail={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 24 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '600', color: AppColors.text },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  description: { fontSize: 14, lineHeight: 22, color: AppColors.textLight, marginBottom: 16 },
  servings: { ...AppStyles.card, backgroundColor: AppColors.limeTint, borderColor: AppColors.limeBorder, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12 },
  servingsText: { flex: 1, fontSize: 16, fontWeight: '600', color: AppColors.text },
  plan: { marginTop: 16, flexDirection: 'row', gap: 8 },
  marked: { backgroundColor: AppColors.avocado },
  cooked: { alignSelf: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 12, backgroundColor: AppColors.limeTint },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  source: { color: AppColors.primaryDark, fontSize: 13, textDecorationLine: 'underline', paddingVertical: 8 },
  removePanel: { ...AppStyles.card, padding: 12, marginTop: 12 },
  removeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  removeButton: { backgroundColor: AppColors.expiredBg, marginTop: 4 },
  removeText: { color: AppColors.expired },
  section: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginTop: 28, marginBottom: 16 },
  shopping: { gap: 8, marginBottom: 12 },
  shoppingButton: { flexDirection: 'row', gap: 8, backgroundColor: AppColors.limeTint, paddingHorizontal: 12 },
  shoppingLabel: { ...AppStyles.buttonText, flexShrink: 1, textAlign: 'center' },
  shoppingHint: { color: AppColors.textLight, lineHeight: 20 },
  shoppingLink: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 48 },
  shoppingLinkText: { color: AppColors.primaryDark, fontWeight: '600', textDecorationLine: 'underline' },
  disabled: { opacity: 0.5 },
  ingredient: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border },
  ingredientName: { flexGrow: 1, flexShrink: 1, fontSize: 15, lineHeight: 22, color: AppColors.text },
  quantity: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: AppColors.primaryDark },
  step: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  number: { width: 32, height: 32, borderRadius: 10, backgroundColor: AppColors.avocado, textAlign: 'center', lineHeight: 32, color: AppColors.avocadoText, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 24, color: AppColors.text },
});
