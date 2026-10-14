import React from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { Language, LANGUAGE_OPTIONS, useI18n } from '@/store/i18n';
import { NotificationPrefs, useNotificationPrefs } from '@/store/notifications';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function RowToggle({ label, subtitle, value, onValueChange }: {
  label: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.rowToggle}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
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
  const { prefs, updatePrefs } = useNotificationPrefs();

  const dayOptions: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.settingsTitle} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Notifications ── */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <SectionHeader title={t.settingsNotifications} />

            <View style={styles.card}>
              <RowToggle
                label={t.settingsNotifEnabled}
                subtitle={t.settingsNotifEnabledSubtitle}
                value={prefs.enabled}
                onValueChange={(v) => updatePrefs({ enabled: v })}
              />

              {prefs.enabled && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.rowLabel}>{t.settingsNotifDaysBefore}</Text>
                  <View style={styles.segmented}>
                    {dayOptions.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.segment, prefs.daysBefore === n && styles.segmentActive]}
                        onPress={() => updatePrefs({ daysBefore: n as NotificationPrefs['daysBefore'] })}>
                        <Text style={[styles.segmentText, prefs.daysBefore === n && styles.segmentTextActive]}>
                          {t.settingsNotifDay(n)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={[styles.card, { marginTop: 10 }]}>
              <RowToggle
                label={t.settingsNotifSummary}
                subtitle={t.settingsNotifSummarySubtitle}
                value={prefs.dailySummaryEnabled}
                onValueChange={(v) => updatePrefs({ dailySummaryEnabled: v })}
              />
            </View>
          </View>
        )}

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
  divider: { height: 1, backgroundColor: AppColors.border },
  segmented: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segment: { flex: 1, minHeight: 48, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.limeTint },
  segmentActive: { backgroundColor: AppColors.avocado },
  segmentText: { fontSize: 12, fontWeight: '500', color: AppColors.textLight },
  segmentTextActive: { color: AppColors.avocadoText },
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
