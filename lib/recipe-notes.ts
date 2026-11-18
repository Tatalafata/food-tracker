import { isRecipe, type Recipe } from '@/lib/recipes.mjs';
import { wikiRecipeKey } from '@/lib/wiki-recipe';

export const RECIPE_NOTES_KEY = '@chefsuggest:recipe_notes';
export const MAX_RECIPE_NOTE_LENGTH = 2000;

export type RecipeNoteTarget =
  | { recipe: Recipe; servings: number }
  | { article: { title: string; url: string; language: string } };

export type RecipeNote = RecipeNoteTarget & { text: string };

function isRecipeNote(value: unknown): value is RecipeNote {
  const note = value as Partial<RecipeNote> | null;
  if (!note || typeof note.text !== 'string' || !note.text.trim() || note.text.length > MAX_RECIPE_NOTE_LENGTH) return false;

  if ('article' in note) {
    const article = note.article;
    return !!article && typeof article.title === 'string' && typeof article.language === 'string'
      && typeof article.url === 'string' && wikiRecipeKey(article.url) !== null;
  }
  return 'recipe' in note && isRecipe(note.recipe) && typeof note.servings === 'number'
    && Number.isInteger(note.servings) && note.servings >= 1 && note.servings <= 12;
}

export function parseRecipeNotes(raw: string): Record<string, RecipeNote> {
  const entries: unknown = JSON.parse(raw);
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.values(entries).every(isRecipeNote)) {
    throw new Error('Invalid recipe notes');
  }
  return entries as Record<string, RecipeNote>;
}
