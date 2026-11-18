import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useI18n } from '@/store/i18n';
import { useNotificationPrefs } from '@/store/notifications';
import { timerCopy } from '@/store/timer-copy';
import { Reminder, useScheduledReminders } from '@/store/use-scheduled-reminders';

const STORAGE_KEY = '@chefsuggest:timers';

export interface CookingTimer {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  endsAt: number | null;
}

interface TimerState {
  timers: CookingTimer[];
  hidden: boolean;
}

const initial: TimerState = { timers: [], hidden: false };

export function timerRemaining(timer: CookingTimer, now: number) {
  return timer.endsAt === null ? timer.remaining : Math.max(0, timer.endsAt - now);
}

export function formatTimer(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const clock = [minutes, seconds % 60].map(part => String(part).padStart(2, '0')).join(':');
  return hours ? hours + ':' + clock : clock;
}

interface TimerContext extends TimerState {
  ready: boolean;
  error: boolean;
  now: number;
  dockInDetail: boolean;
  setDockInDetail: (visible: boolean) => void;
  addTimer: (name: string, duration: number) => Promise<void>;
  toggleTimer: (id: string) => Promise<void>;
  removeTimer: (id: string) => Promise<void>;
  setHidden: (hidden: boolean) => Promise<void>;
}

const Timers = createContext<TimerContext | null>(null);

export function TimersProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  const { allowed, permissionReady } = useNotificationPrefs();
  const [state, setState] = useState(initial);
  const [now, setNow] = useState(Date.now);
  const [dockInDetail, setDockInDetail] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const current = useRef(initial);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        const stored: TimerState = JSON.parse(raw);
        if (!Array.isArray(stored.timers)) throw new Error('Invalid timers');
        current.current = { timers: stored.timers, hidden: stored.hidden === true };
        setState(current.current);
      }
      setReady(true);
    }).catch(() => setError(true));
  }, []);

  useEffect(() => {
    const deadlines = state.timers.flatMap(timer => timer.endsAt === null ? [] : [timer.endsAt]);
    if (!deadlines.length) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (deadlines.every(deadline => deadline <= timestamp)) clearInterval(interval);
    }, 250);
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') tick(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [state.timers]);

  const save = useCallback((update: (value: TimerState) => TimerState) => {
    const write = writes.current.then(async () => {
      const next = update(current.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setNow(Date.now());
      setState(next);
      setError(false);
    }).catch(() => { setError(true); throw new Error('Could not save timers'); });
    writes.current = write.catch(() => {});
    return write;
  }, []);

  const addTimer: TimerContext['addTimer'] = (name, duration) => save(value => ({
    hidden: false,
    timers: [...value.timers, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim() || timerCopy[language].defaultName, duration, remaining: duration, endsAt: Date.now() + duration,
    }],
  }));

  const toggleTimer: TimerContext['toggleTimer'] = id => save(value => ({
    ...value,
    timers: value.timers.map(timer => {
      if (timer.id !== id) return timer;
      const timestamp = Date.now();
      const remaining = timerRemaining(timer, timestamp);
      if (timer.endsAt !== null && remaining > 0) return { ...timer, endsAt: null, remaining };
      return { ...timer, endsAt: timestamp + (remaining || timer.duration) };
    }),
  }));

  const reminders = useMemo<Reminder[]>(() => state.timers.flatMap(timer => timer.endsAt === null ? [] : [{
    key: timer.id + '/' + timer.endsAt,
    title: 'ChefSuggest · ' + timerCopy[language].finished,
    body: timer.name,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date: timer.endsAt },
  }]), [state.timers, language]);
  useScheduledReminders('timer', reminders, ready && permissionReady, allowed);

  return (
    <Timers.Provider value={{
      ...state, ready, error, now, addTimer, toggleTimer, dockInDetail, setDockInDetail,
      removeTimer: id => save(value => ({ ...value, timers: value.timers.filter(timer => timer.id !== id) })),
      setHidden: hidden => save(value => ({ ...value, hidden })),
    }}>
      {children}
    </Timers.Provider>
  );
}

export function useTimers() {
  const context = useContext(Timers);
  if (!context) throw new Error('useTimers must be used within TimersProvider');
  return context;
}
