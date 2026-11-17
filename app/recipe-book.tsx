import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import InspirationCatalog from '@/components/InspirationCatalog';
import RecipeDetail from '@/components/RecipeDetail';
import RecipeFacts from '@/components/RecipeFacts';
import { AppColors, AppStyles } from '@/constants/theme';
import { inspirationRecipes } from '@/lib/inspiration';
import { Recipe } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';
import { recipeIdentity, useRecipeBook } from '@/store/recipe-book';
import { recipeBookCopy } from '@/store/recipe-book-copy';

type BookTab = 'favorites' | 'history' | 'inspiration';
const tabs: BookTab[] = ['favorites', 'history', 'inspiration'];

interface RecipeRow {
  recipe: Recipe;
  servings?: number;
  cookedAt?: string;
}

export default function RecipeBookScreen() {
  const { language } = useI18n();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const { saved, ready, loadError } = useRecipeBook();
  const copy = recipeBookCopy[language];
  const [tab, setTab] = useState<BookTab>(initialTab === 'inspiration' || initialTab === 'history' ? initialTab : 'favorites');
  const [opened, setOpened] = useState<RecipeRow | null>(null);
  const dateFormat = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' });
  const formatDate = (value: string) => dateFormat.format(new Date(value));
  const catalog = inspirationRecipes(language);
  const recipeInLanguage = (recipe: Recipe) => recipe.wikiPage
    ? catalog.find(item => item.wikiPage === recipe.wikiPage) ?? recipe : recipe;
  const favorites = new Set(saved.filter(item => item.favoriteAt).map(item => recipeIdentity(item.recipe)));
  const mark = tab === 'favorites' ? 'favoriteAt' : 'cookedAt';
  const marked = saved.filter(item => item[mark])
    .sort((a, b) => (b[mark] ?? '').localeCompare(a[mark] ?? ''))
    .map(row => ({ ...row, recipe: recipeInLanguage(row.recipe) }));
  const emptyText = tab === 'favorites' ? copy.emptyFavorites : copy.emptyCooked;
  const loading = tab !== 'inspiration' && !ready && !loadError;

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/recipes');
  }

  return (
    <SafeAreaView style={AppStyles.screen} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.header}>
        <TouchableOpacity style={AppStyles.iconButton} accessibilityRole="button" accessibilityLabel={copy.back} onPress={back}>
          <Ionicons name="chevron-back" size={23} color={AppColors.avocadoText} />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">{copy.title}</Text>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map(item => (
          <TouchableOpacity key={item} style={[styles.tab, item === tab && styles.selected]}
            accessibilityRole="tab" accessibilityState={{ selected: item === tab }} aria-selected={item === tab}
            onPress={() => setTab(item)}>
            <Text style={[styles.label, item === tab && styles.selectedLabel]}>{copy[item]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'inspiration' ? <InspirationCatalog onOpenRecipe={recipe => setOpened({ recipe })} />
        : loading ? <ActivityIndicator color={AppColors.primaryDark} style={styles.status} /> : (
        <FlatList
          key={tab}
          contentContainerStyle={styles.list}
          data={marked}
          keyExtractor={row => recipeIdentity(row.recipe)}
          ListHeaderComponent={loadError
            ? <Text accessibilityRole="alert" style={styles.status}>{copy.readError}</Text>
            : null}
          ListEmptyComponent={!loadError
            ? <Text style={styles.status}>{emptyText}</Text>
            : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={item.recipe.name}
              onPress={() => setOpened(item)}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.recipe.name}</Text>
                {favorites.has(recipeIdentity(item.recipe)) && <Ionicons name="star" color={AppColors.avocadoText} size={18} />}
                <Ionicons name="chevron-forward" color={AppColors.primaryDark} size={18} />
              </View>
              <Text style={styles.cardBody} numberOfLines={2}>{item.recipe.description}</Text>
              {tab === 'history' && item.cookedAt && (
                <Text style={styles.cardBody}>{formatDate(item.cookedAt)}</Text>
              )}
              <RecipeFacts recipe={item.recipe} />
            </TouchableOpacity>
          )}
        />
      )}
      {opened && (
        <RecipeDetail
          recipe={opened.recipe}
          initialServings={opened.servings}
          onClose={() => setOpened(null)}
          onOpenCalendar={(day) => {
            setOpened(null);
            router.navigate({ pathname: '/calendar', params: { day, focus: String(Date.now()) } });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  title: { flex: 1, fontSize: 27, fontWeight: '600', color: AppColors.text },
  tabs: { flexDirection: 'row', gap: 4, backgroundColor: AppColors.limeTint, marginHorizontal: 16, borderRadius: 16, padding: 4 },
  tab: { flex: 1, minHeight: 48, borderRadius: 13, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  selected: { backgroundColor: AppColors.avocado },
  label: { color: AppColors.text, fontSize: 13, textAlign: 'center' },
  selectedLabel: { color: AppColors.avocadoText, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  status: { color: AppColors.textLight, fontSize: 14, lineHeight: 22, margin: 16 },
  card: { ...AppStyles.card, padding: 15, marginBottom: 10, gap: 7 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '600', color: AppColors.text },
  cardBody: { color: AppColors.textLight, fontSize: 14, lineHeight: 20 },
});
