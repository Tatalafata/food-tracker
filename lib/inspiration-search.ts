import index from '@/lib/data/inspiration-index.json';
import facts from '@/lib/data/inspiration-facts.json';
import selections from '@/lib/data/inspiration-photos.json';
import { InspirationFilter, inspirationRecipes } from '@/lib/inspiration';
import type { Recipe } from '@/lib/recipes.mjs';
import type { STANDARD_DIETS } from '@/store/dietary-preferences';
import type { Language } from '@/store/i18n';

export interface InspirationPhoto {
  title: string;
  url: string;
  author: string;
  license: string;
  source: string;
  licenseUrl?: string;
}

export type DishType = 'savory' | 'sweet';
export type Difficulty = Recipe['difficulty'] | 'advanced';
export type DietId = keyof typeof STANDARD_DIETS;

interface RecipeFacts {
  minutes?: number;
  difficulty?: Difficulty;
  diets?: readonly DietId[];
}

export interface CatalogFilters {
  dishes: DishType[];
  difficulties: Difficulty[];
  maxMinutes: number | null;
  diets: DietId[];
  onlyPhotos: boolean;
}

export const emptyCatalogFilters: CatalogFilters = {
  dishes: [], difficulties: [], maxMinutes: null, diets: [], onlyPhotos: false,
};

interface OnlineRecipe {
  title: string;
  language: string;
  url: string;
  tags: string[];
}

export type InspirationResult = Omit<OnlineRecipe, 'url'> & RecipeFacts & { photo?: InspirationPhoto } & (
  { id: string; recipe: Recipe; url?: never } | { id: string; url: string; recipe?: never }
);

const online: OnlineRecipe[] = index;
const publishedFacts = facts as Record<string, RecipeFacts>;
const curatedPhotos = selections as { recipes: string[]; photo: InspirationPhoto }[];
const photosByRecipe = new Map(curatedPhotos.flatMap(row => row.recipes.map(key => [key, row.photo] as const)));
export const inspirationPhotoCredits = curatedPhotos.map(row => row.photo);

// Some sources omit course categories even for familiar dishes in the photo selection.
const savoryDishes = /\b(appetizer|antipasto|falafel|lasagn[ae]|focacci[ae]|risott[oi]|hummus|guacamole|gazpacho|ratatouille|caponata|carbonara|pesto|minestrone|shakshuka|shakshouka|gnocchi|parmigiana|couscous|sushi|piadina|chana masala|baba ghanoush)\b/i;
const sweetDishes = /\b(pancakes?|brownie[s]?|cheesecake|panna cotta|ice cream|sorbet|tarte tatin|crumble)\b/i;

function recipeTags({ title, tags }: OnlineRecipe) {
  if (tags.includes('sweet') || tags.includes('savory')) return tags;
  if (savoryDishes.test(title)) return [...tags, 'savory'];
  if (sweetDishes.test(title)) return [...tags, 'sweet'];
  return tags;
}
const wordGroups = [
  'pollo chicken poulet huhn hahn hähnchen',
  'manzo beef boeuf rind', 'maiale pork porc schwein',
  'pesce fish poisson fisch', 'salmone salmon saumon lachs', 'tonno tuna thon thunfisch',
  'pasta spaghetti noodles pâtes nudeln', 'riso rice riz reis',
  'pomodoro pomodori tomato tomatoes tomate tomates tomaten',
  'patata patate potato potatoes kartoffel kartoffeln',
  'zucchina zucchine zucchini courgette courgettes',
  'melanzana melanzane eggplant aubergine aubergines',
  'funghi fungo mushroom mushrooms champignon champignons pilz pilze',
  'ceci chickpea chickpeas kichererbse kichererbsen',
  'lenticchie lenticchia lentil lentils lentille lentilles linsen',
  'fagioli fagiolo bean beans haricot haricots bohnen',
  'insalata salad salade salat', 'zuppa soup soupe suppe minestra',
  'panino sandwich brötchen', 'pane bread pain brot',
  'dolce dolci sweet dessert desserts nachspeise', 'torta torte cake cakes gâteau kuchen',
  'biscotto biscotti cookie cookies biscuit biscuits keks kekse',
  'mele mela apple apples pomme pommes apfel äpfel',
  'banana banane bananas bananen', 'cioccolato chocolate chocolat schokolade',
  'formaggio cheese fromage käse', 'uovo uova egg eggs oeuf œuf ei eier',
  'vegana vegane vegano vegani vegan végétalien végane',
].map(group => words(group));
const ignored = new Set(['di', 'da', 'del', 'della', 'ai', 'al', 'alla', 'in', 'con', 'e', 'a', 'il', 'le',
  'of', 'with', 'and', 'the', 'de', 'des', 'du', 'et', 'avec', 'mit', 'und']);

function words(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

export function inspirationIndex(language: Language): InspirationResult[] {
  const local = inspirationRecipes(language);
  const ids = new Set(local.map(recipe => recipe.wikiPage));
  const available = online.filter(entry => !ids.has(decodeURIComponent(entry.url.split('/wiki/Cookbook:')[1] ?? '')));
  const groups = (['savory', 'sweet', 'vegan'] as const).map(filter => ({
    filter, pages: new Set(inspirationRecipes(language, filter).map(recipe => recipe.wikiPage)),
  }));
  const featured = local.map(recipe => {
    const tags = groups.filter(group => group.pages.has(recipe.wikiPage)).map(group => group.filter);
    const id = 'local:' + recipe.wikiPage;
    const diets: DietId[] = tags.includes('vegan') ? ['vegan', 'vegetarian'] : [];
    if (tags.includes('sweet') || recipe.wikiPage === 'Caprese_Salad') {
      if (!diets.includes('vegetarian')) diets.push('vegetarian');
    }
    return {
      id, recipe, language, title: recipe.name, photo: photosByRecipe.get(id), tags, diets,
      minutes: recipe.totalMinutes, difficulty: recipe.difficulty,
    };
  });
  const external = available.map(entry => ({
    ...entry,
    tags: recipeTags(entry),
    id: entry.url,
    photo: photosByRecipe.get(entry.url),
    ...publishedFacts[entry.url],
  }));
  const results: InspirationResult[] = [...featured, ...external];
  return results.sort((a, b) =>
    Number(!!b.photo) - Number(!!a.photo)
    || Number(b.language === language) - Number(a.language === language)
    || Number(!!b.recipe) - Number(!!a.recipe)
    || a.title.localeCompare(b.title, language));
}

export function filterInspiration(records: InspirationResult[], filters: CatalogFilters) {
  return records.filter(record => {
    if (filters.dishes.length && !filters.dishes.some(dish => record.tags.includes(dish))) return false;
    if (filters.difficulties.length && (!record.difficulty || !filters.difficulties.includes(record.difficulty))) return false;
    if (filters.maxMinutes !== null && (record.minutes === undefined || record.minutes > filters.maxMinutes)) return false;
    if (!filters.diets.every(diet => record.diets?.includes(diet))) return false;
    return !filters.onlyPhotos || Boolean(record.photo);
  });
}

export function activeCatalogFilterCount(filters: CatalogFilters) {
  return filters.dishes.length + filters.difficulties.length + filters.diets.length
    + Number(filters.maxMinutes !== null) + Number(filters.onlyPhotos);
}

export function searchInspiration(records: InspirationResult[], query: string, language: Language) {
  const tokens = words(query);
  const terms = tokens.filter(word => !ignored.has(word));
  if (!terms.length) return records;

  const alternatives = terms.map(term => wordGroups.find(group => group.includes(term)) ?? [term]);
  return records.flatMap(record => {
    const title = words(record.title);
    const searchable = [...title, ...record.tags];
    const scores = terms.map((term, i) => title.includes(term) ? 5
      : title.some(word => term.length >= 3 && word.startsWith(term)) ? 3
        : alternatives[i].some(word => searchable.includes(word)) ? 2 : 0);
    if (scores.includes(0)) return [];
    const phrase = title.join(' ');
    const search = tokens.join(' ');
    const match = phrase === search ? 24 : phrase.includes(search) ? 12 : 0;
    return [{ record, score: scores.reduce((sum, score) => sum + score, match)
      + Number(record.language === language) * 2 + Number(!!record.photo) + Number(!!record.recipe) }];
  }).sort((a, b) => b.score - a.score).map(({ record }) => record);
}
