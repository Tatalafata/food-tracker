import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { localReminderDate } from '@/lib/local-date';
import { isRecipe, Recipe } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';
import { useNotificationPrefs } from '@/store/notifications';
import { planningCopy } from '@/store/planning-copy';
import { Reminder, useScheduledReminders } from '@/store/use-scheduled-reminders';

const PLANS_KEY = '@chefsuggest:recipe_plans';

export interface RecipePlan {
  id: string;
  recipe: Recipe;
  day: string;
  servings: number;
  reminderTime?: string;
}

function isPlan(plan: RecipePlan) {
  return plan && typeof plan.id === 'string' && isRecipe(plan.recipe)
    && localReminderDate(plan.day, '12:00') !== null
    && Number.isInteger(plan.servings) && plan.servings >= 1 && plan.servings <= 12;
}

interface RecipePlansContextType {
  plans: RecipePlan[];
  ready: boolean;
  loadError: boolean;
  savePlan: (plan: Omit<RecipePlan, 'id'>) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
}

const RecipePlansContext = createContext<RecipePlansContextType | null>(null);

export function RecipePlansProvider({ children }: { children: React.ReactNode }) {
  const { allowed, permissionReady } = useNotificationPrefs();
  const { language } = useI18n();
  const [plans, setPlans] = useState<RecipePlan[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latest = useRef<RecipePlan[]>([]);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(PLANS_KEY)
      .then((stored) => {
        const data = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(data)) throw new Error('Invalid recipe calendar');
        latest.current = data.filter(isPlan);
        setPlans(latest.current);
        setReady(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  const savePlans = useCallback((update: (current: RecipePlan[]) => RecipePlan[]) => {
    const write = writes.current.then(async () => {
      const next = update(latest.current);
      await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(next));
      latest.current = next;
      setPlans(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  const savePlan = useCallback((plan: Omit<RecipePlan, 'id'>) => savePlans((current) => {
    const existing = current.find((entry) => entry.day === plan.day
      && JSON.stringify(entry.recipe) === JSON.stringify(plan.recipe));
    if (existing) return current.map((entry) => entry.id === existing.id ? { ...plan, id: entry.id } : entry);
    return [...current, { ...plan, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }];
  }), [savePlans]);

  const removePlan = useCallback((id: string) => savePlans((current) => current.filter((plan) => plan.id !== id)), [savePlans]);

  const reminders = useMemo<Reminder[]>(() => plans.flatMap((plan) => {
    const date = plan.reminderTime && localReminderDate(plan.day, plan.reminderTime);
    return date ? [{
      key: `${plan.id}/${date.getTime()}/${language}`,
      title: `Make It Dinner! · ${planningCopy[language].reminder}`,
      body: plan.recipe.name,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date },
    }] : [];
  }), [language, plans]);
  useScheduledReminders('recipe', reminders, ready && permissionReady, allowed);

  return (
    <RecipePlansContext.Provider value={{ plans, ready, loadError, savePlan, removePlan }}>
      {children}
    </RecipePlansContext.Provider>
  );
}

export function useRecipePlans() {
  const context = useContext(RecipePlansContext);
  if (!context) throw new Error('useRecipePlans must be used within RecipePlansProvider');
  return context;
}
