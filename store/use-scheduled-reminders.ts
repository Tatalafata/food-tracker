import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export const REMINDER_CHANNEL = 'chefsuggest-reminders';

export type Reminder = {
  key: string;
  title: string;
  body: string;
  trigger: Notifications.DateTriggerInput | Notifications.DailyTriggerInput;
};

type Scope = 'expiry' | 'recipe' | 'summary';

export async function prepareReminderChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'ChefSuggest',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export function useScheduledReminders(
  scope: Scope,
  reminders: Reminder[],
  ready: boolean,
  allowed: boolean,
  legacySummaryId?: string | null,
) {
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    let stale = false;
    pending.current = pending.current.then(async () => {
      if (stale) return;
      const desired = new Map((allowed ? reminders : []).map((reminder) => [reminder.key, reminder]));
      if (desired.size > 0) await prepareReminderChannel();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const request of scheduled) {
        if (stale) return;
        const data = request.content.data;
        const owned = data?.reminderScope === scope
          || (scope === 'expiry' && typeof data?.itemId === 'string')
          || (scope === 'summary' && request.identifier === legacySummaryId);
        if (!owned) continue;
        const key = typeof data?.reminderKey === 'string' ? data.reminderKey : '';
        const reminder = desired.get(key);
        if (reminder && reminder.title === request.content.title && reminder.body === request.content.body) {
          desired.delete(key);
        } else {
          await Notifications.cancelScheduledNotificationAsync(request.identifier);
        }
      }
      for (const reminder of desired.values()) {
        if (stale) return;
        if (reminder.trigger.type === Notifications.SchedulableTriggerInputTypes.DATE
          && Number(reminder.trigger.date) <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            data: { reminderScope: scope, reminderKey: reminder.key },
          },
          trigger: { ...reminder.trigger, channelId: REMINDER_CHANNEL },
        });
      }
    }).catch(() => console.warn('Could not update ChefSuggest reminders'));
    return () => { stale = true; };
  }, [scope, reminders, ready, allowed, legacySummaryId]);
}
