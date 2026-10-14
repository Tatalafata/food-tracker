import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { Recipe } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';

export default function RecipeFacts({ recipe }: { recipe: Recipe }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <View style={styles.fact}>
        <Ionicons name="time-outline" size={16} color={AppColors.avocadoText} />
        <Text style={styles.text}>{t.recipeEstimatedTime(recipe.totalMinutes)}</Text>
      </View>
      <View style={[styles.fact, styles.difficulty]}>
        <Text style={styles.text}>{recipe.difficulty === 'easy' ? t.recipeEasy : t.recipeStandard}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: AppColors.limeTint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  difficulty: { backgroundColor: AppColors.warmTint },
  text: { fontSize: 13, fontWeight: '500', color: AppColors.avocadoText },
});
