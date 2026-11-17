import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppCalendar from '@/components/AppCalendar';
import ReminderAccess from '@/components/ReminderAccess';
import { AppColors, AppStyles } from '@/constants/theme';
import { localDateKey, localReminderDate } from '@/lib/local-date';
import { Recipe } from '@/lib/recipes.mjs';
import { useI18n } from '@/store/i18n';
import { useNotificationPrefs } from '@/store/notifications';
import { planningCopy } from '@/store/planning-copy';
import { useRecipePlans } from '@/store/recipe-plans';

interface RecipePlannerProps {
  recipe: Recipe;
  servings: number;
  onOpenCalendar: (day: string) => void;
  onCancel: () => void;
}

export default function RecipePlanner({ recipe, servings, onOpenCalendar, onCancel }: RecipePlannerProps) {
  const { language, t } = useI18n();
  const { ready, loadError, savePlan } = useRecipePlans();
  const { requestPermission } = useNotificationPrefs();
  const copy = planningCopy[language];
  const today = localDateKey();
  const [day, setDay] = useState(today);
  const [remind, setRemind] = useState(false);
  const [time, setTime] = useState('18:00');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const dayLabel = new Intl.DateTimeFormat(language, { dateStyle: 'full' }).format(new Date(`${day}T12:00:00`));

  async function save() {
    if (!ready || submitting.current || day < localDateKey()) return;
    const reminderTime = remind ? time.trim() : undefined;
    if (reminderTime !== undefined) {
      const date = localReminderDate(day, reminderTime);
      if (!date || date.getTime() <= Date.now()) {
        setError(copy.invalidTime);
        return;
      }
    }

    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      await savePlan({ recipe, servings, day, reminderTime });
      if (reminderTime !== undefined) await requestPermission();
      setSaved(true);
    } catch {
      setError(t.saveError);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <View style={styles.panel}>
        <Text accessibilityLiveRegion="polite" style={styles.label}>{copy.saved}</Text>
        <Text style={styles.date}>{dayLabel}{remind ? ` · ${time.trim()}` : ''}</Text>
        {remind && <ReminderAccess />}
        <TouchableOpacity accessibilityRole="button" style={AppStyles.button} onPress={() => onOpenCalendar(day)}>
          <Text style={AppStyles.buttonText}>{copy.openCalendar}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.label}>{copy.selectDay}</Text>
      <AppCalendar
        minDate={today}
        disableAllTouchEventsForDisabledDays
        markedDates={{ [day]: { selected: true, accessibilityLabel: copy.selectedDay } }}
        onDayPress={(date) => { if (!submitting.current) setDay(date.dateString); }}
      />
      <Text style={styles.date}>{dayLabel}</Text>
      <View style={styles.row}>
        <Text style={[styles.label, styles.flex]}>{copy.reminder}</Text>
        <Switch
          accessibilityLabel={copy.reminder}
          disabled={saving}
          value={remind}
          onValueChange={(value) => { setRemind(value); setError(null); }}
          trackColor={{ false: AppColors.border, true: AppColors.avocado }}
        />
      </View>
      {remind && (
        <View>
          <Text style={styles.label}>{copy.reminderTime}</Text>
          <TextInput
            accessibilityLabel={copy.reminderTime}
            style={[AppStyles.input, styles.time]}
            editable={!saving}
            value={time}
            onChangeText={(value) => { setTime(value); setError(null); }}
            maxLength={5}
            placeholder="18:00"
            selectTextOnFocus
          />
          <ReminderAccess />
        </View>
      )}
      {(error || loadError) && <Text accessibilityRole="alert" style={styles.error}>{error ?? t.saveError}</Text>}
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={[AppStyles.button, styles.cancel]} disabled={saving} onPress={onCancel}>
          <Text style={AppStyles.buttonText}>{t.cancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready || saving }}
          style={[AppStyles.button, styles.flex, (!ready || saving) && styles.disabled]}
          disabled={!ready || saving}
          onPress={save}>
          {saving ? <ActivityIndicator color={AppColors.onPrimary} /> : <Text style={[AppStyles.buttonText, styles.center]}>{copy.savePlan}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { ...AppStyles.card, gap: 10, padding: 12, marginTop: 16 },
  label: { color: AppColors.text, fontWeight: '600', fontSize: 15, lineHeight: 22 },
  date: { color: AppColors.textLight, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  time: { alignSelf: 'flex-start', minWidth: 105, marginTop: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  flex: { flex: 1 },
  cancel: { backgroundColor: AppColors.limeTint },
  center: { textAlign: 'center' },
  error: { color: AppColors.expired },
  disabled: { opacity: 0.6 },
});
