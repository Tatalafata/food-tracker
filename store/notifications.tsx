import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const PREFS_KEY = '@chefsuggest:notif_prefs';
const DAILY_ID_KEY = '@chefsuggest:daily_notif_id';

export interface NotificationPrefs {
  enabled: boolean;
  daysBefore: 1 | 2 | 3;
  dailySummaryEnabled: boolean;
}

const DEFAULTS: NotificationPrefs = {
  enabled: true,
  daysBefore: 2,
  dailySummaryEnabled: false,
};

interface NotificationPrefsContextType {
  prefs: NotificationPrefs;
  updatePrefs: (update: Partial<NotificationPrefs>) => Promise<void>;
}

const NotificationPrefsContext = createContext<NotificationPrefsContextType | null>(null);

export function NotificationPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((stored) => {
      if (stored) {
        try {
          setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
        } catch {}
      }
    });
  }, []);

  const updatePrefs = useCallback(
    async (update: Partial<NotificationPrefs>) => {
      const next = { ...prefs, ...update };
      setPrefs(next);
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));

      if (Platform.OS === 'web') return;

      // Handle daily summary toggle
      if ('dailySummaryEnabled' in update) {
        const storedId = await AsyncStorage.getItem(DAILY_ID_KEY);
        if (storedId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(storedId);
          } catch {}
        }
        if (next.dailySummaryEnabled) {
          try {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'ChefSuggest: Pantry Reminder',
                body: 'Check your pantry — some items may be expiring this week!',
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 9,
                minute: 0,
              },
            });
            await AsyncStorage.setItem(DAILY_ID_KEY, id);
          } catch (e) {
            console.warn('Failed to schedule daily summary', e);
          }
        } else {
          await AsyncStorage.removeItem(DAILY_ID_KEY);
        }
      }
    },
    [prefs],
  );

  return (
    <NotificationPrefsContext.Provider value={{ prefs, updatePrefs }}>
      {children}
    </NotificationPrefsContext.Provider>
  );
}

export function useNotificationPrefs() {
  const ctx = useContext(NotificationPrefsContext);
  if (!ctx) throw new Error('useNotificationPrefs must be used within NotificationPrefsProvider');
  return ctx;
}
