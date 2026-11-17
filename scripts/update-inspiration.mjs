import { mkdir, writeFile } from 'node:fs/promises';

const userAgent = 'ChefSuggest/1.0 (https://github.com/Tatalafata/food-tracker)';
const categoryFilter = [
  'Vegan recipes', 'Recipes for dessert', 'Recipes for cakes', 'Recipes for cookies',
  'Main course recipes', 'Side dish recipes', 'Recipes for soup', 'Recipes for salads',
  'Dolci', 'Ricette vegane', 'Primi piatti', 'Secondi piatti', 'Contorni', 'Antipasti',
].map(name => 'Category:' + name).join('|');

async function query(host, parameters) {
  const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...parameters });
  const response = await fetch('https://' + host + '/w/api.php?' + params, {
    headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${host}: HTTP ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error.info);
  return result;
}

async function recipes(language, generator) {
  const pages = new Map();
  let next = {};
  do {
    const response = await query(language + '.wikibooks.org', {
      ...generator, prop: 'pageimages|info|categories', piprop: 'name|thumbnail', pithumbsize: '400',
      pilicense: 'free', inprop: 'url', clcategories: categoryFilter, cllimit: 'max', ...next,
    });
    for (const page of response.query?.pages ?? []) {
      if ('redirect' in page) continue;
      const previous = pages.get(page.pageid);
      pages.set(page.pageid, { ...previous, ...page, categories: [
        ...(previous?.categories ?? []), ...(page.categories ?? []),
      ] });
    }
    next = response.continue;
  } while (next);
  return [...pages.values()].map(page => ({ ...page, language }));
}

const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
function plainText(value) {
  return (value ?? '').replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (full, entity) => {
    if (entity[0] !== '#') return entities[entity] ?? full;
    const point = entity.startsWith('#x') ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return point <= 0x10ffff ? String.fromCodePoint(point) : full;
  }).replace(/\s+/g, ' ').trim();
}

function fileKey(name) {
  return name.replaceAll('_', ' ').normalize('NFC');
}

async function photos(pages) {
  const files = [...new Set(pages.map(page => page.pageimage).filter(name =>
    typeof name === 'string' && /\.jpe?g$/i.test(name) && !/logo|flag|diagram|icon|symbol/i.test(name)))];
  const credits = new Map();
  for (let start = 0; start < files.length; start += 40) {
    const { query: result } = await query('commons.wikimedia.org', {
      prop: 'imageinfo', iiprop: 'timestamp|extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
      titles: files.slice(start, start + 40).map(name => 'File:' + name).join('|'),
    });
    for (const entry of result?.pages ?? []) {
      const file = entry.imageinfo?.[0];
      // Restrict previews to photographic file formats uploaded before widely available image generators.
      if (!file || file.timestamp >= '2021-01-01') continue;
      const { Artist, LicenseShortName, LicenseUrl } = file.extmetadata ?? {};
      const author = plainText(Artist?.value);
      const license = LicenseShortName?.value;
      if (!license || !/^(CC BY(?:-SA)? [234]\.0|CC0|Public domain)$/i.test(license)) continue;
      const licenseUrl = LicenseUrl?.value?.replace(/^http:/, 'https:');
      if (license.startsWith('CC BY') && (!author || !licenseUrl?.startsWith('https://creativecommons.org/'))) continue;
      const source = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(entry.title.replaceAll(' ', '_'));
      credits.set(fileKey(entry.title.slice(5)), { author, license, source, ...(licenseUrl && { licenseUrl }) });
    }
  }
  return credits;
}

function tags(page, title) {
  const categories = page.categories.map(category => category.title.replace(/^[^:]+:/, '')).join(' ');
  const vegan = /vegan recipes|ricette vegane/i.test(categories) || /\bvegan[aei]?\b/i.test(title);
  const sweet = /dessert|cakes|cookies|\bdolci\b/i.test(categories)
    || /\b(cake|torta|cookies?|biscotti|muffins?|pudding|brownies?|gelato|tiramisu|tiramisù|crumble)\b/i.test(title);
  const savory = /main course|side dish|recipes for (soup|salads)|primi piatti|secondi piatti|antipasti|contorni/i.test(categories)
    || /\b(pasta|pizza|fish|chicken|salmon|pollo|salmone|soup|rice|riso|insalata|salad|stew|noodles|zuppa)\b/i.test(title);
  return [...(sweet ? ['sweet'] : savory ? ['savory'] : []), ...(vegan ? ['vegan'] : [])];
}

const [italian, english] = await Promise.all([
  recipes('it', { generator: 'allpages', gapnamespace: '0', gapprefix: 'Libro di cucina/Ricette/', gapfilterredir: 'nonredirects', gaplimit: '50' }),
  recipes('en', { generator: 'categorymembers', gcmtitle: 'Category:Recipes with images', gcmnamespace: '102', gcmtype: 'page', gcmlimit: '50' }),
]);
const candidates = [...italian, ...english];
const credits = await photos(candidates);
const index = candidates.flatMap(page => {
  const title = page.title.replace(/^(Cookbook:|Libro di cucina\/Ricette\/)/, '').trim();
  if (page.length < 450 || !page.fullurl || !title || /\/(sandbox|prova|indice|elenco)\b/i.test(page.title)) return [];
  const credit = page.pageimage && credits.get(fileKey(page.pageimage));
  const thumbnail = page.thumbnail?.source?.split('?')[0];
  const photo = credit && thumbnail && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(thumbnail)
    ? { url: thumbnail, ...credit } : undefined;
  if (page.language === 'en' && !photo) return [];
  return [{ title, language: page.language, url: page.fullurl, tags: tags(page, title), ...(photo && { photo }) }];
});
if (index.length < 200 || index.filter(entry => entry.photo).length < 100) {
  throw new Error('Wikimedia returned too few recipes or attributable previews');
}
const directory = new URL('../lib/data/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('inspiration-index.json', directory), '[\n  ' + index.map(entry => JSON.stringify(entry)).join(',\n  ') + '\n]\n');
console.log(`${index.length} recipes, ${index.filter(entry => entry.photo).length} photos and ${index.filter(entry => entry.language === 'it').length} Italian pages`);
