import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname, useSegments } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ReminderAccess from '@/components/ReminderAccess';
import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { timerCopy } from '@/store/timer-copy';
import { formatTimer, timerRemaining, useTimers } from '@/store/timers';

export function HomeTimers() {
  const { t, language } = useI18n();
  const copy = timerCopy[language];
  const { timers, now, hidden, ready, error, addTimer, toggleTimer, removeTimer, setHidden } = useTimers();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const duration = (Number(minutes) * 60 + Number(seconds)) * 1000;
  const canStart = ready && !saving && !!name.trim() && duration > 0;

  async function start() {
    if (!canStart) return;
    setSaving(true);
    try {
      await addTimer(name, duration);
      setName('');
      setMinutes('');
      setSeconds('');
      setEditing(false);
    } catch {
      // Keep the form open with the user's values so they can retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.homeCard}>
      <View style={styles.header}>
        <Ionicons name="timer-outline" size={23} color={AppColors.avocadoText} />
        <Text accessibilityRole="header" style={styles.title}>{copy.title}</Text>
        <TouchableOpacity
          style={styles.icon}
          accessibilityRole="button"
          accessibilityLabel={editing ? t.cancel : copy.add}
          disabled={!ready || saving}
          onPress={() => setEditing(value => !value)}>
          <Ionicons name={editing ? 'close' : 'add'} size={24} color={AppColors.avocadoText} />
        </TouchableOpacity>
      </View>
      {editing && (
        <View style={styles.form}>
          <Text style={styles.label}>{copy.name}</Text>
          <TextInput accessibilityLabel={copy.name} placeholder={copy.nameExample} placeholderTextColor={AppColors.textLight}
            style={AppStyles.input} value={name} onChangeText={setName} maxLength={60} editable={!saving} />
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>{copy.minutes}</Text>
              <TextInput accessibilityLabel={copy.minutes} inputMode="numeric" maxLength={4} placeholder="0"
                style={AppStyles.input} value={minutes} onChangeText={value => setMinutes(value.replace(/\D/g, ''))} editable={!saving} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{copy.seconds}</Text>
              <TextInput accessibilityLabel={copy.seconds} inputMode="numeric" maxLength={2} placeholder="0"
                style={AppStyles.input} value={seconds} onChangeText={value => setSeconds(value.replace(/\D/g, ''))} editable={!saving} />
            </View>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={start} disabled={!canStart}
            style={[AppStyles.button, !canStart && styles.disabled]}>
            <Text style={AppStyles.buttonText}>{copy.start}</Text>
          </TouchableOpacity>
        </View>
      )}
      {timers.map(timer => {
        const remaining = timerRemaining(timer, now);
        const finished = remaining === 0;
        const paused = timer.endsAt === null;
        const action = finished ? copy.restart : paused ? copy.resume : copy.pause;
        return (
          <View key={timer.id} style={[styles.timerRow, finished && styles.finished]}>
            <View style={styles.timerText}>
              <Text style={styles.timerName} numberOfLines={1}>{timer.name}</Text>
              <Text accessibilityLiveRegion={finished ? 'polite' : 'none'} style={styles.timerTime}>
                {finished ? copy.finished : formatTimer(remaining)}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={action + ' · ' + timer.name}
              onPress={() => void toggleTimer(timer.id).catch(() => {})} style={styles.icon}>
              <Ionicons name={finished ? 'refresh' : paused ? 'play' : 'pause'} size={20} color={AppColors.avocadoText} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.remove + ' · ' + timer.name}
              onPress={() => void removeTimer(timer.id).catch(() => {})} style={styles.icon}>
              <Ionicons name="trash-outline" size={19} color={AppColors.textLight} />
            </TouchableOpacity>
          </View>
        );
      })}
      {hidden && timers.length > 0 && (
        <TouchableOpacity accessibilityRole="button" style={styles.restore}
          onPress={() => void setHidden(false).catch(() => {})}>
          <Text style={styles.restoreText}>{copy.show}</Text>
        </TouchableOpacity>
      )}
      {Platform.OS !== 'web' && timers.some(timer => timerRemaining(timer, now) > 0) && <ReminderAccess />}
      {error && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
    </View>
  );
}

export function TimerDock({ onLeaveDetail }: { onLeaveDetail?: () => void }) {
  const { language } = useI18n();
  const copy = timerCopy[language];
  const { timers, now, hidden, dockInDetail, setHidden } = useTimers();
  const pathname = usePathname();
  const segments = useSegments();
  const { bottom, right } = useSafeAreaInsets();
  if ((!onLeaveDetail && (pathname === '/' || dockInDetail)) || hidden || timers.length === 0) return null;
  const priority = (timer: typeof timers[number]) => timerRemaining(timer, now) === 0 ? 2 : timer.endsAt === null ? 1 : 0;
  const shown = [...timers].sort((a, b) => priority(a) - priority(b) || timerRemaining(a, now) - timerRemaining(b, now)).slice(0, 2);
  const aboveTabs = !onLeaveDetail && segments[0] === '(tabs)';

  return (
    <View style={[styles.dock, { bottom: bottom + (aboveTabs ? 86 : 12), right: right + 12 }]}>
      <TouchableOpacity style={styles.dockContent} accessibilityRole="button" accessibilityLabel={copy.open}
        onPress={() => {
          onLeaveDetail?.();
          router.navigate({ pathname: '/', params: { timers: String(Date.now()) } });
        }}>
        <Ionicons name="timer-outline" size={20} color={AppColors.avocadoText} />
        <View style={styles.dockRows}>
          {shown.map(timer => {
            const remaining = timerRemaining(timer, now);
            return (
              <View key={timer.id} style={styles.dockRow}>
                <Text numberOfLines={1} style={styles.dockName}>{timer.name}</Text>
                <Text style={styles.dockTime} accessibilityLiveRegion={remaining ? 'none' : 'polite'}>
                  {remaining ? formatTimer(remaining) : copy.finished}
                </Text>
              </View>
            );
          })}
          {timers.length > shown.length && <Text style={styles.dockName}>+{timers.length - shown.length}</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.hide} style={styles.icon}
        onPress={() => void setHidden(true).catch(() => {})}>
        <Ionicons name="close" size={21} color={AppColors.avocadoText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  homeCard: { ...AppStyles.card, marginHorizontal: 24, marginBottom: 16, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: AppColors.text },
  icon: { ...AppStyles.iconButton, backgroundColor: 'transparent' },
  form: { gap: 8, marginTop: 8, marginBottom: 12 },
  label: { color: AppColors.text, fontSize: 14, marginBottom: 4 },
  fields: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  field: { flex: 1 },
  disabled: { opacity: 0.5 },
  timerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.limeTint, borderRadius: 14, marginTop: 8, paddingLeft: 10 },
  timerText: { flex: 1, minWidth: 0, paddingVertical: 6 },
  timerName: { fontSize: 14, fontWeight: '500', color: AppColors.text },
  timerTime: { fontSize: 15, color: AppColors.avocadoText, fontWeight: '600', fontVariant: ['tabular-nums'] },
  finished: { backgroundColor: AppColors.warmTint },
  restore: { minHeight: 48, justifyContent: 'center' },
  restoreText: { color: AppColors.primaryDark, fontWeight: '600', fontSize: 14 },
  error: { color: AppColors.expired, marginTop: 6 },
  dock: { ...AppStyles.card, position: 'absolute', zIndex: 20, elevation: 8, backgroundColor: AppColors.avocado,
    flexDirection: 'row', alignItems: 'center', maxWidth: '92%', width: 235 },
  dockContent: { flex: 1, minWidth: 0, minHeight: 48, paddingLeft: 10, paddingVertical: 6, gap: 7, flexDirection: 'row', alignItems: 'center' },
  dockRows: { flex: 1, gap: 3 },
  dockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  dockName: { fontSize: 12, color: AppColors.avocadoText, flexShrink: 1 },
  dockTime: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], color: AppColors.avocadoText },
});
