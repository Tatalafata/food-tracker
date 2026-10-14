import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getExpiryStatus, PantryItem, usePantry } from '@/store/pantry';

export default function CalendarScreen() {
  const { items } = usePantry();
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      markedDates[date] = { marked: true, dotColor, selected: date === selectedDate, selectedColor: AppColors.primary };
    });

    if (selectedDate && !markedDates[selectedDate]) {
      markedDates[selectedDate] = { selected: true, selectedColor: AppColors.primary };
    }
    return { markedDates, itemsByDate };
  }, [items, selectedDate]);

  const selectedItems = selectedDate ? (itemsByDate[selectedDate] ?? []) : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.calendarTitle}</Text>
        <Text style={styles.subtitle}>{t.calendarSubtitle}</Text>
      </View>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: AppColors.background, calendarBackground: AppColors.white,
          textSectionTitleColor: AppColors.primary, selectedDayBackgroundColor: AppColors.primary,
          selectedDayTextColor: AppColors.white, todayTextColor: AppColors.primaryLight,
          dayTextColor: AppColors.text, textDisabledColor: '#ccc',
          dotColor: AppColors.warning, selectedDotColor: AppColors.white,
          arrowColor: AppColors.primary, monthTextColor: AppColors.primaryDark,
          indicatorColor: AppColors.primary, textDayFontWeight: '500',
          textMonthFontWeight: '700', textDayHeaderFontWeight: '600',
        }}
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
          <FlatList
            data={selectedItems}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => {
              const status = getExpiryStatus(item.expiryDate);
              const color = status === 'expired' ? AppColors.expired : status === 'warning' ? AppColors.warning : AppColors.good;
              return (
                <View style={styles.dayItem}>
                  <View style={[styles.dayDot, { backgroundColor: color }]} />
                  <Text style={styles.dayItemName}>{item.name}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.noneText}>{t.calendarNothingOnDay}</Text>}
          />
        </View>
      )}
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
  container: { flex: 1, backgroundColor: AppColors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary },
  title: { fontSize: 24, fontWeight: '700', color: AppColors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  calendar: { marginHorizontal: 12, marginTop: 12, borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: AppColors.textLight },
  dayPanel: { flex: 1, margin: 12, backgroundColor: AppColors.white, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dayTitle: { fontSize: 14, fontWeight: '700', color: AppColors.text, marginBottom: 12 },
  dayItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayItemName: { fontSize: 15, color: AppColors.text },
  noneText: { fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginTop: 8 },
});
