import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useI18n } from '@/store/i18n';
import { planningCopy } from '@/store/planning-copy';
import { prepareReminderChannel, Reminder, useScheduledReminders } from '@/store/use-scheduled-reminders';

const PREFS_KEY = '@chefsuggest:notif_prefs';
const LEGACY_DAILY_ID_KEY = '@chefsuggest:daily_notif_id';
export const EXPIRY_DAYS = [3, 2, 1, 0] as const;
export type ExpiryDay = (typeof EXPIRY_DAYS)[number];

interface NotificationPrefs {
  expiryDays: ExpiryDay[];
  dailySummaryEnabled: boolean;
}

const DEFAULTS: NotificationPrefs = { expiryDays: [2], dailySummaryEnabled: false };

function readPrefs(stored: string | null): NotificationPrefs {
  if (!stored) return DEFAULTS;
  const previous = JSON.parse(stored);
  const expiryDays = Array.isArray(previous?.expiryDays)
    ? EXPIRY_DAYS.filter((day) => previous.expiryDays.includes(day))
    : previous?.enabled === false
      ? []
      : EXPIRY_DAYS.filter((day) => day === (previous?.daysBefore ?? 2));
  return { expiryDays, dailySummaryEnabled: expiryDays.length > 0 && previous?.dailySummaryEnabled === true };
}

function isAllowed(permission: Notifications.NotificationPermissionsStatus | null) {
  return permission?.granted === true || permission?.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

interface NotificationPrefsContextType {
  prefs: NotificationPrefs;
  ready: boolean;
  permissionReady: boolean;
  allowed: boolean;
  canAsk: boolean;
  requestPermission: () => Promise<boolean>;
  updatePrefs: (update: (prefs: NotificationPrefs) => NotificationPrefs) => Promise<void>;
}

const NotificationPrefsContext = createContext<NotificationPrefsContextType | null>(null);

export function NotificationPrefsProvider({ children }: { children: React.ReactNode }) {
  const { language, t } = useI18n();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [legacySummaryId, setLegacySummaryId] = useState<string | null>(null);
  const [permission, setPermission] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const latest = useRef(DEFAULTS);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.multiGet([PREFS_KEY, LEGACY_DAILY_ID_KEY])
      .then((entries) => {
        setLegacySummaryId(entries[1][1]);
        latest.current = readPrefs(entries[0][1]);
        setPrefs(latest.current);
      })
      .catch(() => console.warn('Could not load reminder preferences'))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const refreshPermission = () => {
      Notifications.getPermissionsAsync().then(setPermission).catch(() => {});
    };
    refreshPermission();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => listener.remove();
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    try {
      await prepareReminderChannel();
      const current = await Notifications.getPermissionsAsync();
      const next = !isAllowed(current) && current.canAskAgain
        ? await Notifications.requestPermissionsAsync()
        : current;
      setPermission(next);
      return isAllowed(next);
    } catch {
      return false;
    }
  }, []);

  const updatePrefs: NotificationPrefsContextType['updatePrefs'] = useCallback((update) => {
    const write = writes.current.then(async () => {
      const next = update(latest.current);
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      latest.current = next;
      setPrefs(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  const allowed = isAllowed(permission);
  const permissionReady = permission !== null;
  const summary = useMemo<Reminder[]>(() => prefs.dailySummaryEnabled && prefs.expiryDays.length > 0 ? [{
    key: language,
    title: `Make It Dinner! · ${t.settingsNotifSummary}`,
    body: planningCopy[language].summaryAlert,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
  }] : [], [language, prefs.dailySummaryEnabled, prefs.expiryDays.length, t.settingsNotifSummary]);
  useScheduledReminders('summary', summary, ready && permissionReady, allowed, legacySummaryId);

  return (
    <NotificationPrefsContext.Provider value={{
      prefs, ready, permissionReady, allowed, canAsk: permission?.canAskAgain !== false,
      requestPermission, updatePrefs,
    }}>
      {children}
    </NotificationPrefsContext.Provider>
  );
}

export function useNotificationPrefs() {
  const ctx = useContext(NotificationPrefsContext);
  if (!ctx) throw new Error('useNotificationPrefs must be used within NotificationPrefsProvider');
  return ctx;
}
