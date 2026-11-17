import { readFile, writeFile } from 'node:fs/promises';

const base = new URL('../lib/data/', import.meta.url);
const catalogue = JSON.parse(await readFile(new URL('inspiration-index.json', base), 'utf8'));
const dietCategories = {
  vegan: /^(vegan recipes|ricette vegane)$/i,
  vegetarian: /^(vegetarian recipes|ricette vegetariane)$/i,
  glutenFree: /^(gluten.free recipes|ricette senza glutine)$/i,
  lactoseFree: /^(lactose.free recipes|ricette senza lattosio)$/i,
  dairyFree: /^(dairy.free recipes|ricette senza latte)$/i,
  eggFree: /^(egg.free recipes|ricette senza uova)$/i,
  nutFree: /^(nut.free recipes|ricette senza frutta a guscio)$/i,
  lowCarb: /^(low.carbohydrate recipes|low.carb recipes)$/i,
  halal: /^halal recipes$/i,
  kosher: /^kosher recipes$/i,
};

const dairyAndEggs = /\b(milk|buttermilk|cream|cheese|butter|yog[hu]+rt|eggs?|parmesan|latte|burro|panna|formaggi[oa]|yogurt|uov[oa]|parmigiano|pecorino)\b/i;
const meatAndFish = /\b(chicken|beef|steak|pork|bacon|ham|lamb|veal|gelat[ie]n[ae]?|lard|fish|salmon|tuna|anchov(?:y|ies)|shrimps?|prawns?|poll[oi]|manzo|maiale|pancetta|prosciutto|guanciale|pesce|salmone|tonno|acciugh[ae]|gamber[oi])\b/i;
const glutenGrains = /\b(wheat|barley|rye|spelt|semolina|grano|frumento|orzo|segale|farro|semola)\b/i;
const pork = /\b(pork|bacon|ham|lard|pancetta|prosciutto|guanciale|maiale|strutto)\b/i;

function hasConflictingIngredient(diet, ingredients) {
  switch (diet) {
    case 'vegan': return dairyAndEggs.test(ingredients) || meatAndFish.test(ingredients) || /\b(honey|miele)\b/i.test(ingredients);
    case 'vegetarian': return meatAndFish.test(ingredients);
    case 'glutenFree': return glutenGrains.test(ingredients);
    case 'halal': return pork.test(ingredients) || /\b(wine|beer|rum|vodka|vino|birra)\b/i.test(ingredients);
    case 'kosher': return pork.test(ingredients) || /\b(shrimps?|prawns?|crab|lobster|mussels|clams|gamber[oi]|granchio|cozze|vongole)\b/i.test(ingredients);
    default: return false;
  }
}

function field(source, names) {
  return source.match(new RegExp('(?:^|[\\n|])\\s*(?:' + names + ')\\s*=\\s*([^}\n|]+)', 'i'))?.[1].trim();
}

function parseMinutes(text) {
  if (!text) return;
  const clean = text.toLowerCase().replace(/'{2,}/g, '').replace(/&nbsp;/g, ' ').trim();
  const units = '(hours?|hrs?|h|or[ae]|minutes?|minut[oi]|mins?|m)';
  const part = '(\\d+)(?:\\s*[-–]\\s*(\\d+))?\\s*' + units;
  const twoParts = clean.match(new RegExp('^' + part + '(?:\\s*(?:and|e|,|\\+)\\s*|\\s+)' + part + '$'));
  const onePart = clean.match(new RegExp('^' + part + '$'));
  const asMinutes = (start, end, unit) => Number(end ?? start) * (/^(h|o)/.test(unit) ? 60 : 1);
  const result = twoParts
    ? asMinutes(twoParts[1], twoParts[2], twoParts[3]) + asMinutes(twoParts[4], twoParts[5], twoParts[6])
    : onePart ? asMinutes(onePart[1], onePart[2], onePart[3]) : 0;
  if (result >= 1 && result <= 1440) return result;
}

function extract(content, categories) {
  const summary = content.match(/\{\{(?:recipe ?summary|scheda ricetta)\b[\s\S]*?\}\}/i)?.[0] ?? '';
  const introduction = content.split(/^\s*==/m, 1)[0];
  const time = field(summary, 'total ?time|time|tempo totale|tempo');
  const separate = introduction.match(/(?:^|\n)[*;:'\s]*(?:tempo totale|total time)[*:'\s]+([^\n]+)/i)?.[1];
  const stated = introduction.match(/(?:preparat[oa] in|pront[oa] in|ready in)\s+(\d{1,3}\s+(?:minutes?|minut[oi]|mins?|or[ae]))\b/i)?.[1];
  const minutes = parseMinutes(time) ?? parseMinutes(separate) ?? parseMinutes(stated);

  const rating = field(summary, 'difficulty|difficoltà')?.toLowerCase();
  const level = { 1: 'easy', 2: 'easy', 3: 'standard', 4: 'advanced', 5: 'advanced' };
  const difficulty = level[rating] ?? ({
    easy: 'easy', facile: 'easy', medium: 'standard', moderate: 'standard', media: 'standard',
    hard: 'advanced', difficile: 'advanced', advanced: 'advanced',
  })[rating];
  const categoryNames = [...categories, ...Array.from(content.matchAll(/\[\[(?:category|categoria):([^|\]]+)/gi), m => m[1])]
    .map(name => name.replace(/^(?:category|categoria):/i, '').trim());
  // Source tags sometimes contradict the ingredients on the same page.
  const ingredients = Array.from(content.matchAll(/^={2,6}[ \t]*ingredient[si]\b[^\n]*\n([\s\S]*?)(?=^[ \t]*={2,6}|(?![\s\S]))/gmi), m => m[1]).join('\n')
    .replace(/\[\[(?:cookbook:)?(?:[^|\]\n]+\|)?([^\]\n]+)\]\]/gi, '$1')
    .replace(/\b(?:soy|soya|oat|coconut|almond|rice|plant.based|vegan|dairy.free|peanut|di soia|di avena|di cocco|vegetale)\s+(?:milk|cream|butter|cheese|yogurt|eggs?)\b/gi, '')
    .replace(/\b(?:latte|burro|panna|formaggio)\s+(?:di (?:soia|avena|cocco|mandorla|riso|arachidi)|vegetale)\b/gi, '');
  const diets = Object.entries(dietCategories)
    .filter(([diet, pattern]) => categoryNames.some(name => pattern.test(name)) && !hasConflictingIngredient(diet, ingredients))
    .map(([id]) => id);
  if (diets.includes('vegan') && !diets.includes('vegetarian')) diets.push('vegetarian');
  return { ...(minutes && { minutes }), ...(difficulty && { difficulty }), ...(diets.length && { diets }) };
}

function pageTitle(recipe) {
  return decodeURIComponent(new URL(recipe.url).pathname.slice(6)).replaceAll('_', ' ');
}

async function readBatch(language, titles) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'revisions|categories',
    rvprop: 'content', rvslots: 'main', cllimit: 'max', titles: titles.join('|'),
  });
  const response = await fetch('https://' + language + '.wikibooks.org/w/api.php?' + params, {
    headers: { 'User-Agent': 'ChefSuggest/1.1 (https://github.com/Tatalafata/food-tracker)' },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(language + ': HTTP ' + response.status);
  const body = await response.json();
  if (body.error) throw new Error(body.error.info);
  return body.query.pages;
}

async function collect(language) {
  const rows = catalogue.filter(recipe => recipe.language === language);
  const byTitle = new Map(rows.map(recipe => [pageTitle(recipe), recipe.url]));
  const facts = new Map();
  const size = 32;
  for (let start = 0; start < rows.length; start += size) {
    const pages = await readBatch(language, rows.slice(start, start + size).map(pageTitle));
    for (const page of pages) {
      const url = byTitle.get(page.title);
      if (!url || !page.revisions?.length) continue;
      const fields = extract(page.revisions[0].slots.main.content, page.categories?.map(category => category.title) ?? []);
      if (Object.keys(fields).length) facts.set(url, fields);
    }
  }
  return facts;
}

const facts = new Map((await Promise.all(['it', 'en'].map(collect))).flatMap(group => [...group]));
if (facts.size < 200) throw new Error('Too few pages with documented recipe facts');
const output = Object.fromEntries(catalogue.filter(row => facts.has(row.url)).map(row => [row.url, facts.get(row.url)]));
await writeFile(new URL('inspiration-facts.json', base), JSON.stringify(output, null, 2) + '\n');
console.log([...facts.values()].reduce((counts, row) => ({
  duration: counts.duration + Number(Boolean(row.minutes)),
  difficulty: counts.difficulty + Number(Boolean(row.difficulty)),
  diets: counts.diets + Number(Boolean(row.diets)),
}), { duration: 0, difficulty: 0, diets: 0 }));
