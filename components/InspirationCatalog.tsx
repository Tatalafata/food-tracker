import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { AppColors, AppStyles } from '@/constants/theme';
import type { InspirationFilter } from '@/lib/inspiration';
import { inspirationIndex, InspirationResult, searchInspiration } from '@/lib/inspiration-search';
import type { Recipe } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';
import { recipeBookCopy } from '@/store/recipe-book-copy';

const filters: InspirationFilter[] = ['all', 'savory', 'sweet', 'vegan'];
const singular = { it: 'ricetta', en: 'recipe', fr: 'recette', de: 'Rezept' };
const labels = {
  it: { search: 'Cerca una ricetta', clear: 'Svuota la ricerca', example: 'Es. tiramisù, risotto ai funghi', recipes: 'ricette', empty: 'Nessuna ricetta trovata. Prova un altro nome o cambia filtro.', inApp: 'Ricetta nell’app', failed: 'Impossibile aprire il sito.', photo: 'Foto' },
  en: { search: 'Search recipes', clear: 'Clear search', example: 'E.g. apple pie, mushroom risotto', recipes: 'recipes', empty: 'No recipes found. Try a different name or filter.', inApp: 'In-app recipe', failed: 'Could not open the website.', photo: 'Photo' },
  fr: { search: 'Rechercher une recette', clear: 'Effacer la recherche', example: 'Ex. tiramisu, risotto aux champignons', recipes: 'recettes', empty: 'Aucune recette trouvée. Essayez un autre nom ou filtre.', inApp: 'Recette dans l’application', failed: 'Impossible d’ouvrir le site.', photo: 'Photo' },
  de: { search: 'Rezept suchen', clear: 'Suche leeren', example: 'Z. B. Tiramisu, Pilzrisotto', recipes: 'Rezepte', empty: 'Keine Rezepte gefunden. Probiere einen anderen Namen oder Filter.', inApp: 'Rezept in der App', failed: 'Die Seite konnte nicht geöffnet werden.', photo: 'Foto' },
};

export default function InspirationCatalog({ onOpenRecipe }: { onOpenRecipe: (recipe: Recipe) => void }) {
  const { language } = useI18n();
  const copy = labels[language];
  const book = recipeBookCopy[language];
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InspirationFilter>('all');
  const [error, setError] = useState(false);
  const list = useRef<FlatList<InspirationResult>>(null);
  const recipes = useMemo(() => inspirationIndex(language), [language]);
  const results = useMemo(() => searchInspiration(recipes, query, filter, language), [recipes, query, filter, language]);

  useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [query, filter]);

  async function open(url: string) {
    setError(false);
    try {
      await Linking.openURL(url);
    } catch {
      setError(true);
    }
  }

  return (
    <View style={styles.catalog}>
      <View style={styles.controls}>
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
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clear} accessibilityRole="button" accessibilityLabel={copy.clear} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={AppColors.avocadoText} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filters}>
          {filters.map(value => (
            <TouchableOpacity key={value} style={[styles.filter, value === filter && styles.selected]}
              accessibilityRole="button" accessibilityState={{ selected: value === filter }}
              onPress={() => setFilter(value)}>
              <Text style={styles.filterLabel}>{book[value]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.count}>
          {new Intl.NumberFormat(language).format(results.length)} {results.length === 1 ? singular[language] : copy.recipes}
        </Text>
        {error && <Text accessibilityRole="alert" style={styles.error}>{copy.failed}</Text>}
      </View>
      <FlatList
        ref={list}
        key={columns}
        data={results}
        keyExtractor={item => item.id}
        numColumns={columns}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columns}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{copy.empty}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: columns === 3 ? '32%' : '49%' }]}>
            <TouchableOpacity accessibilityRole={item.recipe ? 'button' : 'link'} accessibilityLabel={item.title}
              onPress={() => item.recipe ? onOpenRecipe(item.recipe) : void open(item.url)}>
              <View style={styles.photo}>
                <Ionicons name="restaurant-outline" size={26} color={AppColors.primaryDark} />
                {item.photo && <Image source={item.photo.url} style={StyleSheet.absoluteFill} contentFit="cover"
                  cachePolicy="disk" recyclingKey={item.id} />}
              </View>
              <View style={styles.cardText}>
                <Text style={styles.name} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.meta}>{item.recipe ? copy.inApp : 'Wikibooks · ' + item.language.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
            {item.photo && (
              <TouchableOpacity
                accessibilityRole="link"
                style={styles.credit}
                onPress={() => void open(item.photo!.source)}>
                <Text style={styles.creditLabel} numberOfLines={2}>
                  {[copy.photo, item.photo.author, item.photo.license].filter(Boolean).join(' · ')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { flex: 1, width: '100%', maxWidth: 980, alignSelf: 'center' },
  controls: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  search: { ...AppStyles.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 4, minHeight: 52, gap: 8 },
  input: { minWidth: 0, flex: 1, fontSize: 16, minHeight: 48, color: AppColors.text },
  clear: { ...AppStyles.iconButton, backgroundColor: 'transparent' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filter: { ...AppStyles.card, minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' },
  selected: { backgroundColor: AppColors.avocado },
  filterLabel: { color: AppColors.avocadoText, fontSize: 14 },
  count: { color: AppColors.textLight, fontSize: 13, marginBottom: 4 },
  error: { color: AppColors.expired, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  columns: { justifyContent: 'space-between', marginBottom: 10 },
  card: { ...AppStyles.card, overflow: 'hidden' },
  photo: { aspectRatio: 1.32, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center' },
  cardText: { paddingHorizontal: 9, paddingVertical: 9 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: AppColors.text },
  meta: { fontSize: 12, color: AppColors.textLight, marginTop: 4 },
  credit: { minHeight: 48, paddingHorizontal: 9, justifyContent: 'center' },
  creditLabel: { fontSize: 10, lineHeight: 13, color: AppColors.primaryDark, textDecorationLine: 'underline' },
  empty: { color: AppColors.textLight, lineHeight: 22, paddingTop: 16 },
});
