import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';
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
        trackColor={{ false: AppColors.border, true: AppColors.primaryLight }}
        thumbColor={value ? AppColors.primary : '#f4f3f4'}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { prefs, updatePrefs } = useNotificationPrefs();

  const dayOptions: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.settingsTitle}</Text>
      </View>

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
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary,
  },
  title: { fontSize: 24, fontWeight: '700', color: AppColors.white },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: AppColors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  sectionSubtitle: { fontSize: 13, color: AppColors.textLight, marginBottom: 14, marginTop: -6 },
  card: {
    backgroundColor: AppColors.white, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  rowToggle: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
  },
  rowInfo: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: AppColors.text, marginVertical: 8 },
  rowSubtitle: { fontSize: 12, color: AppColors.textLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: AppColors.border, marginHorizontal: -16 },
  segmented: {
    flexDirection: 'row', gap: 8, marginBottom: 14,
  },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: AppColors.border,
    alignItems: 'center', backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  segmentText: { fontSize: 12, fontWeight: '600', color: AppColors.textLight },
  segmentTextActive: { color: '#fff' },
  optionList: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 14, padding: 16, borderWidth: 2, borderColor: AppColors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  optionSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.goodBg },
  optionFlag: { fontSize: 28, marginRight: 14 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: AppColors.text },
  optionLabelSelected: { color: AppColors.primary },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: AppColors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.primary },
});
