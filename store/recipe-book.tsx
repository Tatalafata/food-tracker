import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { isRecipe, Recipe } from '@/lib/recipes.mjs';

const SAVED_KEY = '@chefsuggest:recipe_book';
const HISTORY_PREFIX = '@chefsuggest:recipe_history:';

export interface SavedRecipe {
  recipe: Recipe;
  servings: number;
  favoriteAt?: string;
  cookedAt?: string;
}

interface RecipeSearch {
  id: string;
  date: string;
  recipes: Recipe[];
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
  history: RecipeSearch[];
  ready: boolean;
  loadError: boolean;
  recordSearch: (recipes: Recipe[]) => Promise<void>;
  toggleMark: (recipe: Recipe, servings: number, mark: 'favoriteAt' | 'cookedAt') => Promise<void>;
}

const RecipeBookContext = createContext<RecipeBook | null>(null);

export function RecipeBookProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [history, setHistory] = useState<RecipeSearch[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latestSaved = useRef<SavedRecipe[]>([]);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getAllKeys().then(async (keys) => {
      const entries = await AsyncStorage.multiGet([SAVED_KEY, ...keys.filter(key => key.startsWith(HISTORY_PREFIX))]);
      const data: SavedRecipe[] = entries[0][1] ? JSON.parse(entries[0][1]) : [];
      if (!Array.isArray(data)) throw new Error('Invalid saved recipes');
      latestSaved.current = data.filter(entry => isRecipe(entry?.recipe)
        && Number.isInteger(entry.servings) && entry.servings >= 1 && entry.servings <= 12
        && (validDate(entry.favoriteAt) || validDate(entry.cookedAt)));
      setSaved(latestSaved.current);

      const stored = entries.slice(1).flatMap(([, json]) => {
        if (!json) return [];
        const entry: RecipeSearch = JSON.parse(json);
        return typeof entry?.id === 'string' && validDate(entry.date)
          && Array.isArray(entry.recipes) && entry.recipes.length > 0 && entry.recipes.every(isRecipe) ? [entry] : [];
      });
      setHistory(current => {
        const searches = new Map([...stored, ...current].map(entry => [entry.id, entry]));
        return [...searches.values()].sort((a, b) => b.date.localeCompare(a.date));
      });
      setReady(true);
    }).catch(() => setLoadError(true));
  }, []);

  const recordSearch = useCallback(async (recipes: Recipe[]) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString(),
      recipes,
    };
    await AsyncStorage.setItem(HISTORY_PREFIX + entry.id, JSON.stringify(entry));
    setHistory(current => current.some(search => search.id === entry.id) ? current : [entry, ...current]);
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
    <RecipeBookContext.Provider value={{ saved, history, ready, loadError, recordSearch, toggleMark }}>
      {children}
    </RecipeBookContext.Provider>
  );
}

export function useRecipeBook() {
  const book = useContext(RecipeBookContext);
  if (!book) throw new Error('useRecipeBook must be used within RecipeBookProvider');
  return book;
}
