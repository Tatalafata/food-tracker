import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { isRecipe, Recipe } from '@/lib/recipes.mjs';

const SAVED_KEY = '@chefsuggest:recipe_book';

export interface SavedRecipe {
  recipe: Recipe;
  servings: number;
  favoriteAt?: string;
  cookedAt?: string;
}

export function recipeIdentity(recipe: Recipe) {
  if (recipe.wikiPage) return 'wiki:' + recipe.wikiPage;
  const { name, description, totalMinutes, difficulty, ingredients, steps } = recipe;
  const quantities = ingredients.map(({ name, amount, unit }) => [name, amount, unit]);
  return JSON.stringify([name, description, totalMinutes, difficulty, quantities, steps]);
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

interface RecipeBook {
  saved: SavedRecipe[];
  ready: boolean;
  loadError: boolean;
  toggleMark: (recipe: Recipe, servings: number, mark: 'favoriteAt' | 'cookedAt') => Promise<void>;
}

const RecipeBookContext = createContext<RecipeBook | null>(null);

export function RecipeBookProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latestSaved = useRef<SavedRecipe[]>([]);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then(raw => {
      const data: SavedRecipe[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) throw new Error('Invalid saved recipes');
      latestSaved.current = data.filter(entry => isRecipe(entry?.recipe)
        && Number.isInteger(entry.servings) && entry.servings >= 1 && entry.servings <= 12
        && (validDate(entry.favoriteAt) || validDate(entry.cookedAt)));
      setSaved(latestSaved.current);

      setReady(true);
    }).catch(() => setLoadError(true));
  }, []);

  const toggleMark: RecipeBook['toggleMark'] = useCallback((recipe, servings, mark) => {
    const key = recipeIdentity(recipe);
    const write = writes.current.then(async () => {
      const current = latestSaved.current;
      const existing = current.find(entry => recipeIdentity(entry.recipe) === key);
      const updated = {
        ...existing, recipe, servings,
        [mark]: existing?.[mark] ? undefined : new Date().toISOString(),
      };
      const next = current.filter(entry => recipeIdentity(entry.recipe) !== key);
      if (updated.favoriteAt || updated.cookedAt) next.push(updated);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      latestSaved.current = next;
      setSaved(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  return (
    <RecipeBookContext.Provider value={{ saved, ready, loadError, toggleMark }}>
      {children}
    </RecipeBookContext.Provider>
  );
}

export function useRecipeBook() {
  const book = useContext(RecipeBookContext);
  if (!book) throw new Error('useRecipeBook must be used within RecipeBookProvider');
  return book;
}
