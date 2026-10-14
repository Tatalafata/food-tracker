import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useNotificationPrefs } from '@/store/notifications';

const STORAGE_KEY = '@freshtrack:pantry';
const INIT_KEY = '@freshtrack:initialized';

export interface PantryItem {
  id: string;
  name: string;
  barcode?: string;
  expiryDate?: string; // YYYY-MM-DD, undefined/empty = no expiry
  addedDate: string;
  notificationId?: string;
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
  bulkAddItems: (items: Omit<PantryItem, 'id' | 'addedDate'>[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  loading: boolean;
}

const PantryContext = createContext<PantryContextType | null>(null);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { prefs } = useNotificationPrefs();

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
          setItems(MOCK_ITEMS);
        } else if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load pantry', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reschedule all item notifications when prefs change
  useEffect(() => {
    if (loading || items.length === 0 || Platform.OS === 'web') return;
    (async () => {
      const updated = await Promise.all(
        items.map(async (item) => {
          // Cancel existing notification
          if (item.notificationId) {
            try {
              await Notifications.cancelScheduledNotificationAsync(item.notificationId);
            } catch {}
          }
          if (!prefs.enabled || !item.expiryDate) {
            return { ...item, notificationId: undefined };
          }
          try {
            const expiryDate = new Date(item.expiryDate + 'T09:00:00');
            const notifyDate = new Date(expiryDate);
            notifyDate.setDate(notifyDate.getDate() - prefs.daysBefore);
            if (notifyDate > new Date()) {
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'ChefSuggest: Use it soon!',
                  body: `${item.name} expires in ${prefs.daysBefore} day${prefs.daysBefore !== 1 ? 's' : ''} — time to use it up!`,
                  data: { itemId: item.id },
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: notifyDate,
                },
              });
              return { ...item, notificationId };
            }
          } catch (e) {
            console.warn('Notification reschedule failed', e);
          }
          return { ...item, notificationId: undefined };
        }),
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setItems(updated);
    })();
    // Only run when prefs change, not on every items change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.enabled, prefs.daysBefore]);

  const saveItems = useCallback(async (next: PantryItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
  }, []);

  const addItem = useCallback(
    async (item: Omit<PantryItem, 'id' | 'addedDate'>) => {
      const newItem: PantryItem = {
        ...item,
        id: Date.now().toString(),
        addedDate: new Date().toISOString().split('T')[0],
      };

      if (Platform.OS !== 'web' && prefs.enabled && item.expiryDate) {
        try {
          const expiryDate = new Date(item.expiryDate + 'T09:00:00');
          const notifyDate = new Date(expiryDate);
          notifyDate.setDate(notifyDate.getDate() - prefs.daysBefore);
          if (notifyDate > new Date()) {
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'ChefSuggest: Use it soon!',
                body: `${item.name} expires in ${prefs.daysBefore} day${prefs.daysBefore !== 1 ? 's' : ''} — time to use it up!`,
                data: { itemId: newItem.id },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notifyDate,
              },
            });
            newItem.notificationId = notificationId;
          }
        } catch (e) {
          console.warn('Notification scheduling failed', e);
        }
      }

      await saveItems([...items, newItem]);
    },
    [items, saveItems, prefs],
  );

  const bulkAddItems = useCallback(
    async (newItems: Omit<PantryItem, 'id' | 'addedDate'>[]) => {
      const today = new Date().toISOString().split('T')[0];
      const created: PantryItem[] = newItems.map((item, i) => ({
        ...item,
        id: `${Date.now()}-${i}`,
        addedDate: today,
      }));
      await saveItems([...items, ...created]);
    },
    [items, saveItems],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item?.notificationId && Platform.OS !== 'web') {
        try {
          await Notifications.cancelScheduledNotificationAsync(item.notificationId);
        } catch (_) {}
      }
      await saveItems(items.filter((i) => i.id !== id));
    },
    [items, saveItems],
  );

  return (
    <PantryContext.Provider value={{ items, addItem, bulkAddItems, removeItem, loading }}>
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type ExpiryStatus = 'expired' | 'warning' | 'good' | 'none';

export function getExpiryStatus(expiryDate?: string): ExpiryStatus {
  if (!expiryDate) return 'none';
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 3) return 'warning';
  return 'good';
}
