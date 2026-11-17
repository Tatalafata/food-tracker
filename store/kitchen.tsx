import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { equipmentIds, type EquipmentId } from '@/lib/kitchen-equipment';
import { ingredientKey, type ShoppingEntry } from '@/lib/shopping';

const storageKey = '@chefsuggest:kitchen';

interface ShoppingItem extends ShoppingEntry {
  id: string;
  bought: boolean;
}

interface KitchenData {
  shopping: ShoppingItem[];
  equipment: EquipmentId[];
}

const empty: KitchenData = { shopping: [], equipment: [] };

interface KitchenContext extends KitchenData {
  loading: boolean;
  loadError: boolean;
  addToShopping: (entries: readonly ShoppingEntry[]) => Promise<number>;
  toggleBought: (id: string) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;
  toggleEquipment: (id: EquipmentId) => Promise<void>;
}

const Kitchen = createContext<KitchenContext | null>(null);

export function KitchenProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const latest = useRef(empty);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!raw) return;
      const saved = JSON.parse(raw) as KitchenData;
      if (!Array.isArray(saved.shopping) || !Array.isArray(saved.equipment)
        || !saved.shopping.every(item => item && typeof item.id === 'string' && typeof item.name === 'string'
          && typeof item.quantity === 'string' && typeof item.bought === 'boolean')) {
        throw new Error('Invalid saved kitchen data');
      }
      latest.current = {
        shopping: saved.shopping,
        equipment: equipmentIds.filter(id => saved.equipment.includes(id)),
      };
      setData(latest.current);
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const save = useCallback(<T,>(update: (current: KitchenData) => [KitchenData, T]): Promise<T> => {
    if (loading || loadError) return Promise.reject(new Error('Kitchen data unavailable'));
    const task = queue.current.then(async () => {
      const [next, result] = update(latest.current);
      if (next !== latest.current) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        latest.current = next;
        setData(next);
      }
      return result;
    });
    queue.current = task.then(() => {}, () => {});
    return task;
  }, [loading, loadError]);

  const addToShopping: KitchenContext['addToShopping'] = entries => save(current => {
    const shopping = [...current.shopping];
    const indexes = new Map(shopping.map((item, index) => [ingredientKey(item.name), index]));
    let added = 0;
    for (const entry of entries) {
      const name = entry.name.trim();
      const key = ingredientKey(name);
      if (!key) continue;
      const index = indexes.get(key);
      if (index === undefined) {
        indexes.set(key, shopping.length);
        shopping.push({ id: key, name, quantity: entry.quantity.trim(), bought: false });
      } else if (shopping[index].bought) {
        shopping[index] = { ...shopping[index], quantity: entry.quantity.trim(), bought: false };
      } else {
        continue;
      }
      added++;
    }
    return [added > 0 ? { ...current, shopping } : current, added];
  });

  return (
    <Kitchen.Provider value={{
      ...data, loading, loadError, addToShopping,
      toggleBought: id => save(current => [{
        ...current, shopping: current.shopping.map(item => item.id === id ? { ...item, bought: !item.bought } : item),
      }, undefined]),
      removeShoppingItem: id => save(current => [{
        ...current, shopping: current.shopping.filter(item => item.id !== id),
      }, undefined]),
      toggleEquipment: id => save(current => [{
        ...current, equipment: current.equipment.includes(id)
          ? current.equipment.filter(value => value !== id) : [...current.equipment, id],
      }, undefined]),
    }}>
      {children}
    </Kitchen.Provider>
  );
}

export function useKitchen() {
  const context = useContext(Kitchen);
  if (!context) throw new Error('useKitchen must be used inside KitchenProvider');
  return context;
}
