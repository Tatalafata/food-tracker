import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { readWikiRecipe, wikiRecipeKey } from '../lib/wiki-recipe.ts';

const data = new URL('../lib/data/', import.meta.url);
const index = JSON.parse(await readFile(new URL('inspiration-index.json', data), 'utf8'));
const output = new URL('inspiration-text.json', data);
const previous = await readFile(output, 'utf8').then(JSON.parse).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return {};
});
const prepared = {};
const refresh = process.argv.includes('--refresh');
let added = 0;
let unavailable = 0;

for (const { url, title } of index) {
  const key = wikiRecipeKey(url);
  if (!key) throw new Error('Invalid recipe URL: ' + url);
  if (prepared[key]) continue;
  if (previous[key] && !refresh) {
    prepared[key] = previous[key];
    continue;
  }
  try {
    prepared[key] = await readWikiRecipe(url, AbortSignal.timeout(20000));
    added++;
  } catch (error) {
    if (previous[key]) prepared[key] = previous[key];
    else unavailable++;
    console.error(title + ': ' + error.message);
  }
  if ((added + unavailable) % 100 === 0) console.log(added + ' loaded, ' + unavailable + ' unavailable');
  await pause(100);
}

const lines = Object.entries(prepared).map(([key, recipe]) => '  ' + JSON.stringify(key) + ': ' + JSON.stringify(recipe));
if (!lines.length) throw new Error('No downloadable recipes');
await writeFile(output, '{\n' + lines.join(',\n') + '\n}\n');
console.log(lines.length + ' recipes included, ' + unavailable + ' unavailable');
