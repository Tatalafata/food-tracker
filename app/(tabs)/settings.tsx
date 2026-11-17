import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import DietaryChoices from '@/components/DietaryChoices';
import ReminderAccess from '@/components/ReminderAccess';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { useDietaryPreferences } from '@/store/dietary-preferences';
import { Language, LANGUAGE_OPTIONS, useI18n } from '@/store/i18n';
import { EXPIRY_DAYS, ExpiryDay, useNotificationPrefs } from '@/store/notifications';
import { planningCopy } from '@/store/planning-copy';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function RowToggle({ label, subtitle, value, disabled, onValueChange }: {
  label: string; subtitle?: string; value: boolean; disabled: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.rowToggle}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: AppColors.border, true: AppColors.avocado }}
        thumbColor={AppColors.white}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { prefs, ready, updatePrefs } = useNotificationPrefs();
  const { defaultIds, toggleDefault } = useDietaryPreferences();
  const [saveError, setSaveError] = useState(false);
  const [dietSaveError, setDietSaveError] = useState(false);
  const copy = planningCopy[language];

  function save(update: Parameters<typeof updatePrefs>[0]) {
    setSaveError(false);
    void updatePrefs(update).catch(() => setSaveError(true));
  }

  function chooseDay(day: ExpiryDay | null) {
    save((current) => {
      const expiryDays = day === null ? [] : EXPIRY_DAYS.filter((option) =>
        option === day ? !current.expiryDays.includes(option) : current.expiryDays.includes(option));
      return { expiryDays, dailySummaryEnabled: expiryDays.length > 0 && current.dailySummaryEnabled };
    });
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.settingsTitle} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <SectionHeader title={t.settingsNotifications} />
          <View style={[styles.card, styles.expiryCard]}>
            <Text style={styles.rowLabel}>{t.settingsNotifEnabled}</Text>
            <Text style={styles.rowSubtitle}>{copy.expiryHint}</Text>
            <View style={styles.options}>
              {[...EXPIRY_DAYS, null].map((day) => {
                const checked = day === null ? prefs.expiryDays.length === 0 : prefs.expiryDays.includes(day);
                const label = day === null ? copy.never : day === 0 ? copy.sameDay : t.settingsNotifDay(day);
                return (
                  <TouchableOpacity
                    key={day ?? 'never'}
                    accessibilityRole="checkbox"
                    accessibilityLabel={label}
                    accessibilityState={{ checked, disabled: !ready }}
                    aria-checked={checked}
                    disabled={!ready}
                    style={[styles.optionChip, checked && styles.optionChipActive]}
                    onPress={() => chooseDay(day)}>
                    <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={18} color={AppColors.primaryDark} />
                    <Text style={styles.optionChipText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {prefs.expiryDays.length > 0 && <ReminderAccess />}
            {saveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
          </View>
          <View style={[styles.card, { marginTop: 10 }]}>
            <RowToggle
              label={t.settingsNotifSummary}
              subtitle={t.settingsNotifSummarySubtitle}
              value={prefs.dailySummaryEnabled}
              disabled={!ready || prefs.expiryDays.length === 0}
              onValueChange={(v) => save((current) => ({
                ...current, dailySummaryEnabled: current.expiryDays.length > 0 && v,
              }))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <DietaryChoices
            title={t.dietary.defaults}
            hint={t.dietary.defaultsHint}
            selected={new Set(defaultIds)}
            onToggle={(id) => {
              setDietSaveError(false);
              void toggleDefault(id).catch(() => setDietSaveError(true));
            }}
          />
          {dietSaveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
        </View>

        {/* ── Language ── */}
        <View style={styles.section}>
          <SectionHeader title={t.settingsLanguage} />
          <Text style={styles.sectionSubtitle}>{t.settingsLanguageSubtitle}</Text>

          <View style={styles.optionList}>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = language === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  aria-checked={selected}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setLanguage(option.code as Language)}
                  activeOpacity={0.7}>
                  <Text style={styles.optionFlag}>{option.flag}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 18, fontWeight: '600', color: AppColors.text, letterSpacing: -0.3, marginBottom: 10 },
  sectionSubtitle: { fontSize: 14, lineHeight: 21, color: AppColors.textLight, marginBottom: 18 },
  card: { ...AppStyles.card, paddingHorizontal: 18, paddingVertical: 4 },
  rowToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  rowInfo: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: AppColors.text, marginVertical: 8 },
  rowSubtitle: { fontSize: 13, lineHeight: 19, color: AppColors.textLight, marginTop: 2 },
  expiryCard: { paddingVertical: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 12, gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  optionChipActive: { backgroundColor: AppColors.avocado, borderColor: AppColors.limeBorder },
  optionChipText: { fontSize: 14, color: AppColors.avocadoText },
  error: { marginTop: 8, color: AppColors.expired },
  optionList: { ...AppStyles.card, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 76, paddingHorizontal: 20, paddingVertical: 18 },
  optionSelected: { backgroundColor: AppColors.limeTint },
  optionFlag: { fontSize: 25, marginRight: 16 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: AppColors.text },
  optionLabelSelected: { color: AppColors.avocadoText },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: AppColors.textLight, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: AppColors.avocadoText },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.avocadoText },
});
