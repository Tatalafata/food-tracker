import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { localDateKey, localReminderDate } from '@/lib/local-date';
import { useI18n } from '@/store/i18n';
import { useNotificationPrefs } from '@/store/notifications';
import { planningCopy } from '@/store/planning-copy';
import { Reminder, useScheduledReminders } from '@/store/use-scheduled-reminders';

const STORAGE_KEY = '@freshtrack:pantry';
const INIT_KEY = '@freshtrack:initialized';

export interface PantryItem {
  id: string;
  name: string;
  barcode?: string;
  expiryDate?: string; // YYYY-MM-DD, undefined/empty = no expiry
  notes?: string;
  addedDate: string;
}

const MOCK_ITEMS: PantryItem[] = [
  { id: '1', name: 'Whole Milk', expiryDate: '2026-03-08', addedDate: '2026-03-01' },
  { id: '2', name: 'Baby Spinach', expiryDate: '2026-03-09', addedDate: '2026-03-05' },
  { id: '3', name: 'Chicken Breast', expiryDate: '2026-03-10', addedDate: '2026-03-06' },
  { id: '4', name: 'Greek Yogurt', expiryDate: '2026-03-06', addedDate: '2026-03-01' },
  { id: '5', name: 'Cheddar Cheese', expiryDate: '2026-03-17', addedDate: '2026-03-03' },
  { id: '6', name: 'Free Range Eggs', expiryDate: '2026-03-21', addedDate: '2026-03-01' },
  { id: '7', name: 'Orange Juice', expiryDate: '2026-03-14', addedDate: '2026-03-02' },
];

interface PantryContextType {
  items: PantryItem[];
  addItem: (item: Omit<PantryItem, 'id' | 'addedDate'>) => Promise<void>;
  updateItem: (id: string, changes: Pick<PantryItem, 'name' | 'expiryDate' | 'barcode' | 'notes'>) => Promise<void>;
  bulkAddItems: (items: Omit<PantryItem, 'id' | 'addedDate'>[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  removeExpiredItems: (ids: readonly string[]) => Promise<void>;
  loading: boolean;
  loadError: boolean;
}

const PantryContext = createContext<PantryContextType | null>(null);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { prefs, ready, permissionReady, allowed } = useNotificationPrefs();
  const { t, language } = useI18n();
  const latest = useRef<PantryItem[]>([]);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    (async () => {
      try {
        const [stored, initialized] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(INIT_KEY),
        ]);
        if (!initialized) {
          await AsyncStorage.multiSet([
            [STORAGE_KEY, JSON.stringify(MOCK_ITEMS)],
            [INIT_KEY, 'true'],
          ]);
          latest.current = MOCK_ITEMS;
        } else if (stored) {
          latest.current = JSON.parse(stored);
        }
        setItems(latest.current);
      } catch (e) {
        setLoadError(true);
        console.error('Failed to load pantry', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reminders = useMemo<Reminder[]>(() => items.flatMap((item) => {
    const expiry = item.expiryDate && localReminderDate(item.expiryDate, '09:00');
    if (!expiry) return [];
    return prefs.expiryDays.map((days) => {
      const date = new Date(expiry);
      date.setDate(date.getDate() - days);
      return {
        key: `${item.id}/${date.getTime()}/${language}`,
        title: `Make It Dinner! · ${t.settingsNotifEnabled}`,
        body: planningCopy[language].expiryAlert(item.name, days),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date },
      };
    });
  }), [items, language, prefs.expiryDays, t.settingsNotifEnabled]);
  useScheduledReminders('expiry', reminders, !loading && ready && permissionReady, allowed);

  const saveItems = useCallback((update: (items: PantryItem[]) => PantryItem[]) => {
    const write = writes.current.then(async () => {
      const next = update(latest.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      latest.current = next;
      setItems(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  const addItem = useCallback(
    async (item: Omit<PantryItem, 'id' | 'addedDate'>) => {
      await saveItems((current) => [...current, {
        ...item,
        id: Date.now().toString(),
        addedDate: new Date().toISOString().split('T')[0],
      }]);
    },
    [saveItems],
  );

  const bulkAddItems = useCallback(
    async (newItems: Omit<PantryItem, 'id' | 'addedDate'>[]) => {
      const today = new Date().toISOString().split('T')[0];
      const created: PantryItem[] = newItems.map((item, i) => ({
        ...item,
        id: `${Date.now()}-${i}`,
        addedDate: today,
      }));
      await saveItems((current) => [...current, ...created]);
    },
    [saveItems],
  );

  const updateItem: PantryContextType['updateItem'] = useCallback((id, changes) => saveItems(current => {
    if (!current.some(item => item.id === id)) throw new Error('Missing pantry item');
    return current.map(item => item.id === id ? { ...item, ...changes } : item);
  }), [saveItems]);

  const removeItem = useCallback(
    async (id: string) => {
      await saveItems((current) => current.filter((i) => i.id !== id));
    },
    [saveItems],
  );

  const removeExpiredItems = useCallback((ids: readonly string[]) => {
    const selectedIds = new Set(ids);
    return saveItems((current) => current.filter((item) =>
      !selectedIds.has(item.id) || getExpiryStatus(item.expiryDate) !== 'expired'));
  }, [saveItems]);

  return (
    <PantryContext.Provider value={{ items, addItem, updateItem, bulkAddItems, removeItem, removeExpiredItems, loading, loadError }}>
      {children}
    </PantryContext.Provider>
  );
}

export function usePantry() {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error('usePantry must be used within PantryProvider');
  return ctx;
}

export function getDaysUntilExpiry(expiryDate?: string): number {
  if (!expiryDate) return Infinity;
  // Both date-only values use UTC so daylight saving cannot change the day count.
  return (Date.parse(expiryDate) - Date.parse(localDateKey())) / (1000 * 60 * 60 * 24);
}

export type ExpiryStatus = 'expired' | 'warning' | 'good' | 'none';

export function getExpiryStatus(expiryDate?: string): ExpiryStatus {
  if (!expiryDate) return 'none';
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 3) return 'warning';
  return 'good';
}
