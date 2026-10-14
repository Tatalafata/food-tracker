import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';

import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { LANGUAGE_OPTIONS, useI18n } from '@/store/i18n';
import { getExpiryStatus, PantryItem, usePantry } from '@/store/pantry';

LANGUAGE_OPTIONS.forEach(({ code }) => {
  const months = Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1));
  const days = Array.from({ length: 7 }, (_, day) => new Date(2024, 0, 7 + day));
  LocaleConfig.locales[code] = {
    monthNames: months.map((date) => new Intl.DateTimeFormat(code, { month: 'long' }).format(date)),
    monthNamesShort: months.map((date) => new Intl.DateTimeFormat(code, { month: 'short' }).format(date)),
    dayNames: days.map((date) => new Intl.DateTimeFormat(code, { weekday: 'long' }).format(date)),
    dayNamesShort: days.map((date) => new Intl.DateTimeFormat(code, { weekday: 'short' }).format(date)),
    today: { en: 'Today', it: 'Oggi', fr: 'Aujourd’hui', de: 'Heute' }[code],
  };
});

const calendarTheme = {
  calendarBackground: AppColors.surface, textSectionTitleColor: AppColors.textLight,
  selectedDayBackgroundColor: AppColors.avocado, selectedDayTextColor: AppColors.avocadoText,
  todayTextColor: AppColors.avocadoText, dayTextColor: AppColors.text, textDisabledColor: '#ADB6AA',
  dotColor: AppColors.warning, selectedDotColor: AppColors.avocadoText, arrowColor: AppColors.avocadoText,
  monthTextColor: AppColors.avocadoText, textDayFontWeight: '500' as const,
  textMonthFontWeight: '600' as const, textDayHeaderFontWeight: '400' as const,
  arrowStyle: { minWidth: 48, minHeight: 48, alignItems: 'center' as const, justifyContent: 'center' as const },
  weekVerticalMargin: 2,
  'stylesheet.calendar.main': { dayContainer: { flex: 1, alignItems: 'stretch' } },
  'stylesheet.day.basic': {
    base: { width: '100%', height: 48, alignItems: 'center', justifyContent: 'center' },
    selected: { backgroundColor: AppColors.avocado, borderRadius: 14 },
  },
};

export default function CalendarScreen() {
  const { items } = usePantry();
  const { t, language } = useI18n();
  LocaleConfig.defaultLocale = language;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string | undefined>(undefined);

  const { markedDates, itemsByDate } = useMemo(() => {
    const itemsByDate: Record<string, PantryItem[]> = {};
    items.forEach((item) => {
      if (!item.expiryDate) return; // skip no-expiry items
      if (!itemsByDate[item.expiryDate]) itemsByDate[item.expiryDate] = [];
      itemsByDate[item.expiryDate].push(item);
    });

    const markedDates: Record<string, object> = {};
    Object.entries(itemsByDate).forEach(([date, dateItems]) => {
      const worstStatus = dateItems.reduce<'good' | 'warning' | 'expired'>((worst, i) => {
        const s = getExpiryStatus(i.expiryDate);
        if (s === 'expired') return 'expired';
        if (s === 'warning' && worst !== 'expired') return 'warning';
        if (s === 'none') return worst; // no-expiry shouldn't appear here but guard anyway
        return worst;
      }, 'good');
      const dotColor = worstStatus === 'expired' ? AppColors.expired : worstStatus === 'warning' ? AppColors.warning : AppColors.good;
      markedDates[date] = { marked: true, dotColor, selected: date === selectedDate, selectedColor: AppColors.avocado };
    });

    if (selectedDate && !markedDates[selectedDate]) {
      markedDates[selectedDate] = { selected: true, selectedColor: AppColors.avocado };
    }
    return { markedDates, itemsByDate };
  }, [items, selectedDate]);

  const selectedItems = selectedDate ? (itemsByDate[selectedDate] ?? []) : [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.calendarTitle} subtitle={t.calendarSubtitle} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <Calendar
        key={language}
        current={visibleMonth}
        onMonthChange={(month: DateData) => setVisibleMonth(month.dateString)}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={calendarTheme}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <LegendDot color={AppColors.expired} label={t.calendarLegendExpired} />
        <LegendDot color={AppColors.warning} label={t.calendarLegendSoon} />
        <LegendDot color={AppColors.good} label={t.calendarLegendGood} />
      </View>

      {selectedDate && (
        <View style={styles.dayPanel}>
          <Text style={styles.dayTitle}>
            {selectedItems.length > 0
              ? t.calendarDayItems(selectedDate, selectedItems.length)
              : t.calendarDayEmpty(selectedDate)}
          </Text>
          {selectedItems.map((item) => {
              const status = getExpiryStatus(item.expiryDate);
              const color = status === 'expired' ? AppColors.expired : status === 'warning' ? AppColors.warning : AppColors.good;
              return (
                <View key={item.id} style={styles.dayItem}>
                  <View style={[styles.dayDot, { backgroundColor: color }]} />
                  <Text style={styles.dayItemName}>{item.name}</Text>
                </View>
              );
            })}
          {selectedItems.length === 0 && <Text style={styles.noneText}>{t.calendarNothingOnDay}</Text>}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 28 },
  calendar: { ...AppStyles.card, padding: 10, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 10, marginVertical: 20, backgroundColor: AppColors.warmTint, borderRadius: 16, padding: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 12, color: AppColors.textLight },
  dayPanel: { ...AppStyles.card, backgroundColor: AppColors.limeTint, marginTop: 4, padding: 20 },
  dayTitle: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: AppColors.text, marginBottom: 12 },
  dayItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  dayItemName: { flex: 1, fontSize: 15, lineHeight: 22, color: AppColors.text },
  noneText: { fontSize: 14, lineHeight: 21, color: AppColors.textLight, paddingVertical: 8 },
});
