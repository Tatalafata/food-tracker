import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { parseRecipeNotes, RECIPE_NOTES_KEY, type RecipeNote, type RecipeNoteTarget } from '@/lib/recipe-notes';
import { wikiRecipeKey } from '@/lib/wiki-recipe';
import { recipeIdentity } from '@/store/recipe-book';

export function recipeNoteIdentity(target: RecipeNoteTarget) {
  return 'article' in target ? 'article:' + wikiRecipeKey(target.article.url) : recipeIdentity(target.recipe);
}

interface RecipeNotes {
  notes: Record<string, RecipeNote>;
  ready: boolean;
  loadError: boolean;
  saveNote: (target: RecipeNoteTarget, text: string) => Promise<void>;
}

const RecipeNotesContext = createContext<RecipeNotes | null>(null);

export function RecipeNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<RecipeNotes['notes']>({});
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latest = useRef(notes);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(RECIPE_NOTES_KEY).then(raw => {
      latest.current = raw === null ? {} : parseRecipeNotes(raw);
      setNotes(latest.current);
      setReady(true);
    }).catch(() => setLoadError(true));
  }, []);

  const saveNote: RecipeNotes['saveNote'] = useCallback((target, text) => {
    const key = recipeNoteIdentity(target);
    const write = writes.current.then(async () => {
      const next = { ...latest.current };
      if (text) next[key] = { ...target, text };
      else delete next[key];
      await AsyncStorage.setItem(RECIPE_NOTES_KEY, JSON.stringify(next));
      latest.current = next;
      setNotes(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  return <RecipeNotesContext.Provider value={{ notes, ready, loadError, saveNote }}>{children}</RecipeNotesContext.Provider>;
}

export function useRecipeNotes() {
  const store = useContext(RecipeNotesContext);
  if (!store) throw new Error('useRecipeNotes must be used within RecipeNotesProvider');
  return store;
}
