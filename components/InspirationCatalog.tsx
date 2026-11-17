import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import InspirationFilters from '@/components/InspirationFilters';
import { AppColors, AppStyles } from '@/constants/theme';
import { activeCatalogFilterCount, emptyCatalogFilters, filterInspiration, inspirationIndex, InspirationResult, type OnlineInspiration, searchInspiration } from '@/lib/inspiration-search';
import type { Recipe } from '@/lib/recipes.mjs';
import { STANDARD_DIET_IDS } from '@/store/dietary-preferences';
import { useI18n } from '@/store/i18n';
import { formatInspirationCount, inspirationCopy } from '@/store/inspiration-copy';

export default function InspirationCatalog({ onOpenRecipe, onOpenOnline }: {
  onOpenRecipe: (recipe: Recipe) => void;
  onOpenOnline: (recipe: OnlineInspiration) => void;
}) {
  const { language, t } = useI18n();
  const copy = inspirationCopy[language];
  const levels = { easy: t.recipeEasy, standard: t.recipeStandard, advanced: copy.advanced };
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyCatalogFilters);
  const [showFilters, setShowFilters] = useState(false);
  const list = useRef<FlatList<InspirationResult>>(null);
  const recipes = useMemo(() => inspirationIndex(language), [language]);
  const availableDiets = useMemo(() =>
    STANDARD_DIET_IDS.filter(diet => recipes.some(recipe => recipe.diets?.includes(diet))), [recipes]);
  const matched = useMemo(() => searchInspiration(recipes, query, language), [recipes, query, language]);
  const results = useMemo(() => filterInspiration(matched, filters), [matched, filters]);
  const active = activeCatalogFilterCount(filters);

  useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [query, filters]);

  return (
    <View style={styles.catalog}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={21} color={AppColors.avocadoText} />
            <TextInput
              style={styles.input}
              accessibilityLabel={copy.search}
              placeholder={copy.example}
              placeholderTextColor={AppColors.textLight}
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {query.length > 0 && (
              <TouchableOpacity style={styles.clear} accessibilityRole="button" accessibilityLabel={copy.clear} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={AppColors.avocadoText} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.filterButton, active > 0 && styles.selected]}
            accessibilityRole="button" accessibilityLabel={active ? copy.filters + ' (' + active + ')' : copy.filters}
            accessibilityState={{ expanded: showFilters }}
            onPress={() => { Keyboard.dismiss(); setShowFilters(true); }}>
            <Ionicons name="options-outline" size={21} color={AppColors.avocadoText} />
            <Text style={styles.filterLabel}>{copy.filters}</Text>
            {active > 0 && <Text style={styles.badge}>{active}</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.resultBar}>
          <Text accessibilityLiveRegion="polite" style={styles.count}>{formatInspirationCount(language, results.length)}</Text>
          {active > 0 && (
            <TouchableOpacity style={styles.reset} accessibilityRole="button" onPress={() => setFilters(emptyCatalogFilters)}>
              <Text style={styles.resetLabel}>{copy.reset}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FlatList
        ref={list}
        data={results}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columns}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{copy.empty}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} accessibilityRole="button" accessibilityLabel={item.title}
            onPress={() => { Keyboard.dismiss(); if (item.recipe) onOpenRecipe(item.recipe); else onOpenOnline(item); }}>
            {item.photo && (
              <View style={styles.photo}>
                <Ionicons name="restaurant-outline" size={26} color={AppColors.primaryDark} />
                <Image source={item.photo.url} style={StyleSheet.absoluteFill} contentFit="cover"
                  cachePolicy="disk" recyclingKey={item.id} />
              </View>
            )}
            <View style={styles.cardText}>
              <Text style={styles.name} numberOfLines={3}>{item.title}</Text>
              {(item.minutes !== undefined || item.difficulty || item.language !== language) && (
                <View style={styles.meta}>
                  {item.minutes !== undefined && (
                    <View style={styles.time}>
                      <Ionicons name="time-outline" size={13} color={AppColors.primaryDark} />
                      <Text style={styles.detail}>{t.recipeEstimatedTime(item.minutes)}</Text>
                    </View>
                  )}
                  {item.difficulty && <Text style={styles.detail}>{levels[item.difficulty]}</Text>}
                  {item.language !== language && <Text style={styles.detail}>{item.language.toUpperCase()}</Text>}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      {showFilters && (
        <InspirationFilters filters={filters} results={matched} availableDiets={availableDiets}
          onClose={() => setShowFilters(false)} onApply={next => { setFilters(next); setShowFilters(false); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { flex: 1, width: '100%', maxWidth: 980, alignSelf: 'center' },
  controls: { paddingHorizontal: 16, paddingTop: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  search: { ...AppStyles.card, flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 4, minHeight: 52, gap: 6, borderRadius: 16 },
  input: { minWidth: 0, flex: 1, fontSize: 15, minHeight: 48, color: AppColors.text },
  clear: { ...AppStyles.iconButton, backgroundColor: 'transparent', width: 36 },
  filterButton: { ...AppStyles.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  selected: { backgroundColor: AppColors.avocado },
  filterLabel: { color: AppColors.avocadoText, fontSize: 13, fontWeight: '600' },
  badge: { color: AppColors.white, backgroundColor: AppColors.primaryDark, borderRadius: 10, minWidth: 19, overflow: 'hidden', textAlign: 'center', fontSize: 12, lineHeight: 19 },
  resultBar: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  count: { color: AppColors.textLight, fontSize: 13 },
  reset: { minHeight: 48, justifyContent: 'center' },
  resetLabel: { color: AppColors.primaryDark, textDecorationLine: 'underline', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  columns: { justifyContent: 'space-between', marginBottom: 12 },
  card: { ...AppStyles.card, width: '48.5%', minHeight: 56, borderRadius: 16, borderColor: AppColors.border, overflow: 'hidden' },
  photo: { aspectRatio: 1.14, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center' },
  cardText: { padding: 10, gap: 7 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: AppColors.text },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 7, rowGap: 3 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  detail: { fontSize: 12, color: AppColors.textLight },
  empty: { color: AppColors.textLight, lineHeight: 22, paddingTop: 16 },
});
