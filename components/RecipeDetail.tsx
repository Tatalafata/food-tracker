import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { Recipe, scaledAmount, formatStep, normalizeStepShares } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';

export default function RecipeDetail({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { t, language } = useI18n();
  const [servings, setServings] = useState(1);
  const normalizedRecipe = normalizeStepShares(recipe);
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={AppStyles.screen}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">{recipe.name}</Text>
          <TouchableOpacity style={AppStyles.iconButton} accessibilityRole="button" accessibilityLabel={t.recipeClose} onPress={onClose}>
            <Ionicons name="close" size={22} color={AppColors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>{recipe.description}</Text>
          <View style={styles.servings}>
            <Text style={styles.servingsText} accessibilityLiveRegion="polite">{t.recipeServings(servings)}</Text>
            <TouchableOpacity style={AppStyles.iconButton} disabled={servings === 1} accessibilityRole="button" accessibilityLabel={t.recipeFewer} onPress={() => setServings(n => n - 1)}>
              <Ionicons name="remove" size={22} color={servings === 1 ? AppColors.border : AppColors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity style={AppStyles.iconButton} disabled={servings === 12} accessibilityRole="button" accessibilityLabel={t.recipeMore} onPress={() => setServings(n => n + 1)}>
              <Ionicons name="add" size={22} color={servings === 12 ? AppColors.border : AppColors.primaryDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.section} accessibilityRole="header">{t.recipeIngredients}</Text>
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
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 16, alignItems: 'center', padding: 24 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '600', color: AppColors.text },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  description: { fontSize: 14, lineHeight: 22, color: AppColors.textLight, marginBottom: 16 },
  servings: { ...AppStyles.card, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12 },
  servingsText: { flex: 1, fontSize: 16, fontWeight: '600', color: AppColors.text },
  section: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginTop: 28, marginBottom: 16 },
  ingredient: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border },
  ingredientName: { flexGrow: 1, flexShrink: 1, fontSize: 15, lineHeight: 22, color: AppColors.text },
  quantity: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: AppColors.primaryDark },
  step: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  number: { width: 32, height: 32, borderRadius: 10, backgroundColor: AppColors.surfaceTint, textAlign: 'center', lineHeight: 32, color: AppColors.primaryDark, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 24, color: AppColors.text },
});
