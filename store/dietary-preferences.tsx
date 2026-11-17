import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = '@chefsuggest:dietary_preferences';

export const STANDARD_DIETS = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  glutenFree: 'Gluten Free',
  lactoseFree: 'Lactose Free',
  dairyFree: 'Dairy Free',
  eggFree: 'Egg Free',
  nutFree: 'Nut Free',
  lowCarb: 'Low Carb',
  keto: 'Keto',
  halal: 'Halal',
  kosher: 'Kosher',
};

export const STANDARD_DIET_IDS = Object.keys(STANDARD_DIETS) as (keyof typeof STANDARD_DIETS)[];

export interface CustomDiet {
  id: string;
  name: string;
  description: string;
}

export function dietaryPrompt(selected: ReadonlySet<string>, custom: readonly CustomDiet[]) {
  const standard = STANDARD_DIET_IDS.filter(id => selected.has(id)).map(id => ({ name: STANDARD_DIETS[id] }));
  const personal = custom.filter(diet => selected.has(diet.id)).map(({ name, description }) => ({ name, description }));
  const active = [...standard, ...personal];
  return active.length === 0 ? ''
    : `\nDietary preferences and exclusions (apply to every ingredient, including condiments and substitutions; exclusions take priority over other notes): ${JSON.stringify(active)}.`;
}

interface SavedPreferences {
  custom: CustomDiet[];
  defaultIds: string[];
}

const EMPTY: SavedPreferences = { custom: [], defaultIds: [] };

interface DietaryPreferencesContextType extends SavedPreferences {
  ready: boolean;
  loadError: boolean;
  addCustom: (name: string, description: string) => Promise<string>;
  toggleDefault: (id: string) => Promise<void>;
}

const DietaryPreferencesContext = createContext<DietaryPreferencesContextType | null>(null);

export function DietaryPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latest = useRef(EMPTY);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        const saved: SavedPreferences = JSON.parse(stored);
        if (!Array.isArray(saved.custom) || !Array.isArray(saved.defaultIds)
          || !saved.custom.every(diet => typeof diet?.id === 'string'
            && typeof diet.name === 'string' && typeof diet.description === 'string')
          || !saved.defaultIds.every(id => typeof id === 'string')) {
          throw new Error('Invalid dietary preferences');
        }
        latest.current = saved;
        setPreferences(saved);
      }
      setReady(true);
    }).catch(() => setLoadError(true));
  }, []);

  const writePreferences = useCallback((update: (current: SavedPreferences) => SavedPreferences) => {
    const write = writes.current.then(async () => {
      const next = update(latest.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      latest.current = next;
      setPreferences(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  const addCustom = useCallback(async (name: string, description: string) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await writePreferences(current => ({
      ...current, custom: [...current.custom, { id, name: name.trim(), description: description.trim() }],
    }));
    return id;
  }, [writePreferences]);

  const toggleDefault = useCallback((id: string) => writePreferences(current => ({
    ...current,
    defaultIds: current.defaultIds.includes(id)
      ? current.defaultIds.filter(value => value !== id)
      : [...current.defaultIds, id],
  })), [writePreferences]);

  return (
    <DietaryPreferencesContext.Provider value={{ ...preferences, ready, loadError, addCustom, toggleDefault }}>
      {children}
    </DietaryPreferencesContext.Provider>
  );
}

export function useDietaryPreferences() {
  const context = useContext(DietaryPreferencesContext);
  if (!context) throw new Error('useDietaryPreferences must be used within DietaryPreferencesProvider');
  return context;
}
