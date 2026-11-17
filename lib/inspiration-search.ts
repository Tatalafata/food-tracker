import index from '@/lib/data/inspiration-index.json';
import { InspirationFilter, inspirationRecipes } from '@/lib/inspiration';
import type { Recipe } from '@/lib/recipes.mjs';
import type { Language } from '@/store/i18n';

interface Photo {
  url: string;
  author: string;
  license: string;
  source: string;
  licenseUrl?: string;
}

interface OnlineRecipe {
  title: string;
  language: string;
  url: string;
  tags: string[];
  photo?: Photo;
}

export type InspirationResult = Omit<OnlineRecipe, 'url'> & (
  { id: string; recipe: Recipe; url?: never } | { id: string; url: string; recipe?: never }
);

const online: OnlineRecipe[] = index;
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
  const byPage = new Map(online.map(entry => [decodeURIComponent(entry.url.split('/wiki/Cookbook:')[1] ?? ''), entry]));
  const available = online.filter(entry => !ids.has(decodeURIComponent(entry.url.split('/wiki/Cookbook:')[1] ?? '')));
  const groups = (['savory', 'sweet', 'vegan'] as const).map(filter => ({
    filter, pages: new Set(inspirationRecipes(language, filter).map(recipe => recipe.wikiPage)),
  }));
  const featured = local.map(recipe => {
    const row = recipe.wikiPage ? byPage.get(recipe.wikiPage) : undefined;
    const tags = groups.filter(group => group.pages.has(recipe.wikiPage)).map(group => group.filter);
    return { id: 'local:' + recipe.wikiPage, recipe, language, title: recipe.name, photo: row?.photo, tags };
  });
  const results: InspirationResult[] = [...featured, ...available.map(entry => ({ ...entry, id: entry.url }))];
  return results.sort((a, b) =>
    Number(!!b.photo) - Number(!!a.photo)
    || Number(b.language === language) - Number(a.language === language)
    || Number(!!b.recipe) - Number(!!a.recipe)
    || a.title.localeCompare(b.title, language));
}

export function searchInspiration(records: InspirationResult[], query: string, filter: InspirationFilter, language: Language) {
  const tokens = words(query);
  const terms = tokens.filter(word => !ignored.has(word));
  const filtered = filter === 'all' ? records : records.filter(record => record.tags.includes(filter));
  if (!terms.length) return filtered;

  const alternatives = terms.map(term => wordGroups.find(group => group.includes(term)) ?? [term]);
  return filtered.flatMap(record => {
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
