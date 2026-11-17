import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { activeCatalogFilterCount, CatalogFilters, DietId, Difficulty, DishType, emptyCatalogFilters, filterInspiration, InspirationResult } from '@/lib/inspiration-search';
import { useI18n } from '@/store/i18n';
import { formatInspirationCount, inspirationCopy } from '@/store/inspiration-copy';

const dishTypes: DishType[] = ['savory', 'sweet'];
const timeLimits = [15, 30, 45, 60];
const difficulties: Difficulty[] = ['easy', 'standard', 'advanced'];

interface Props {
  filters: CatalogFilters;
  results: InspirationResult[];
  availableDiets: DietId[];
  onApply: (filters: CatalogFilters) => void;
  onClose: () => void;
}

function toggle<T>(items: T[], next: T) {
  return items.includes(next) ? items.filter(item => item !== next) : [...items, next];
}

export default function InspirationFilters({ filters, results, availableDiets, onApply, onClose }: Props) {
  const { language, t } = useI18n();
  const copy = inspirationCopy[language];
  const [draft, setDraft] = useState(filters);
  const count = filterInspiration(results, draft).length;
  const hasSelections = activeCatalogFilterCount(draft) > 0;
  const levels = { easy: t.recipeEasy, standard: t.recipeStandard, advanced: copy.advanced };

  function option(label: string, checked: boolean, onPress: () => void) {
    return (
      <TouchableOpacity key={label} accessibilityRole="checkbox" accessibilityLabel={label}
        accessibilityState={{ checked }} aria-checked={checked} onPress={onPress}
        style={[styles.option, checked && styles.optionChecked]}>
        <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={AppColors.primaryDark} />
        <Text style={styles.optionText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>{copy.filters}</Text>
            <TouchableOpacity style={AppStyles.iconButton} accessibilityRole="button" accessibilityLabel={t.cancel} onPress={onClose}>
              <Ionicons name="close" size={23} color={AppColors.avocadoText} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.groups} style={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.group}>
              <Text accessibilityRole="header" style={styles.heading}>{copy.type}</Text>
              <View style={styles.options}>
                {dishTypes.map(dish => option(copy[dish], draft.dishes.includes(dish),
                  () => setDraft(current => ({ ...current, dishes: toggle(current.dishes, dish) }))))}
              </View>
            </View>
            <View style={styles.group}>
              <Text accessibilityRole="header" style={styles.heading}>{copy.time}</Text>
              <View style={styles.options}>
                {timeLimits.map(minutes => option(copy.limit(minutes), draft.maxMinutes === minutes,
                  () => setDraft(current => ({ ...current, maxMinutes: current.maxMinutes === minutes ? null : minutes }))))}
              </View>
            </View>
            <View style={styles.group}>
              <Text accessibilityRole="header" style={styles.heading}>{copy.difficulty}</Text>
              <View style={styles.options}>
                {difficulties.map(level => option(levels[level], draft.difficulties.includes(level),
                  () => setDraft(current => ({ ...current, difficulties: toggle(current.difficulties, level) }))))}
              </View>
            </View>
            {!!availableDiets.length && (
              <View style={styles.group}>
                <Text accessibilityRole="header" style={styles.heading}>{copy.diets}</Text>
                <Text style={styles.hint}>{copy.dietHint}</Text>
                <View style={styles.options}>
                  {availableDiets.map(diet => option(t.dietLabels[diet], draft.diets.includes(diet),
                    () => setDraft(current => ({ ...current, diets: toggle(current.diets, diet) }))))}
                </View>
              </View>
            )}
            <View style={styles.options}>
              {option(copy.onlyPhotos, draft.onlyPhotos, () => setDraft(current => ({ ...current, onlyPhotos: !current.onlyPhotos })))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.reset} accessibilityRole="button" disabled={!hasSelections}
              accessibilityState={{ disabled: !hasSelections }} onPress={() => setDraft(emptyCatalogFilters)}>
              <Text style={[styles.resetLabel, !hasSelections && styles.disabled]}>{copy.reset}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={[AppStyles.button, styles.apply]} onPress={() => onApply(draft)}>
              <Text accessibilityLiveRegion="polite" style={AppStyles.buttonText}>
                {copy.show(formatInspirationCount(language, count))}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(26, 38, 28, 0.42)' },
  sheet: { width: '100%', maxWidth: 610, maxHeight: '90%', backgroundColor: AppColors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { flex: 1, color: AppColors.text, fontSize: 23, fontWeight: '700' },
  body: { flexGrow: 0, flexShrink: 1 },
  groups: { gap: 18, padding: 18 },
  group: { gap: 8, borderBottomWidth: 1, borderBottomColor: AppColors.border, paddingBottom: 14 },
  heading: { color: AppColors.text, fontSize: 16, fontWeight: '700' },
  hint: { color: AppColors.textLight, fontSize: 13, lineHeight: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, maxWidth: '100%', paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, backgroundColor: AppColors.white },
  optionChecked: { backgroundColor: AppColors.limeTint, borderColor: AppColors.primaryLight },
  optionText: { fontSize: 14, color: AppColors.text, flexShrink: 1 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'stretch', borderTopWidth: 1, borderTopColor: AppColors.border },
  reset: { minHeight: 48, justifyContent: 'center', flexShrink: 1, paddingHorizontal: 4 },
  resetLabel: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline', color: AppColors.primaryDark, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  apply: { flex: 1, minWidth: 120, paddingHorizontal: 10 },
});
