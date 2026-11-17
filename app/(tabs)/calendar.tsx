import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarProps } from 'react-native-calendars';

import { SafeAreaView } from 'react-native-safe-area-context';

import AppCalendar from '@/components/AppCalendar';
import RecipeDetail from '@/components/RecipeDetail';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { localDateKey, localReminderDate } from '@/lib/local-date';
import { useI18n } from '@/store/i18n';
import { getExpiryStatus, PantryItem, usePantry } from '@/store/pantry';
import { planningCopy } from '@/store/planning-copy';
import { RecipePlan, useRecipePlans } from '@/store/recipe-plans';

const RECIPE_DOT = '#795491';

export default function CalendarScreen() {
  const { items } = usePantry();
  const { plans, ready, loadError, removePlan } = useRecipePlans();
  const { t, language } = useI18n();
  const copy = planningCopy[language];
  const { day, focus } = useLocalSearchParams<{ day?: string; focus?: string }>();
  const [selectedDate, setSelectedDate] = useState(localDateKey);
  const [visibleMonth, setVisibleMonth] = useState(localDateKey);
  const [openedPlan, setOpenedPlan] = useState<RecipePlan | null>(null);

  useEffect(() => {
    if (typeof day !== 'string' || !localReminderDate(day, '12:00')) return;
    setSelectedDate(day);
    setVisibleMonth(day);
  }, [day, focus]);

  const { markedDates, itemsByDate, plansByDate } = useMemo(() => {
    const itemsByDate: Record<string, PantryItem[]> = {};
    items.forEach((item) => {
      if (item.expiryDate && localReminderDate(item.expiryDate, '12:00')) {
        (itemsByDate[item.expiryDate] ??= []).push(item);
      }
    });
    const plansByDate: Record<string, RecipePlan[]> = {};
    plans.forEach((plan) => (plansByDate[plan.day] ??= []).push(plan));
    const markedDates: NonNullable<CalendarProps['markedDates']> = {};
    Object.entries(itemsByDate).forEach(([date, dateItems]) => {
      const statuses = dateItems.map((item) => getExpiryStatus(item.expiryDate));
      const color = statuses.includes('expired') ? AppColors.expired
        : statuses.includes('warning') ? AppColors.warning : AppColors.good;
      markedDates[date] = { marked: true, dots: [{ key: 'expiry', color, selectedDotColor: color }] };
    });
    Object.keys(plansByDate).forEach((date) => {
      const expiryDots = markedDates[date]?.dots ?? [];
      markedDates[date] = { marked: true, dots: [...expiryDots, { key: 'recipe', color: RECIPE_DOT, selectedDotColor: RECIPE_DOT }] };
    });
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true };
    Object.entries(markedDates).forEach(([date, marking]) => {
      marking.accessibilityLabel = [
        marking.selected && copy.selectedDay,
        itemsByDate[date] && t.pantryTitle,
        plansByDate[date] && copy.planned,
      ].filter(Boolean).join(', ');
    });
    return { markedDates, itemsByDate, plansByDate };
  }, [copy, items, plans, selectedDate, t.pantryTitle]);
  const selectedItems = itemsByDate[selectedDate] ?? [];
  const selectedPlans = plansByDate[selectedDate] ?? [];
  const dateLabel = new Intl.DateTimeFormat(language, { dateStyle: 'full' }).format(new Date(`${selectedDate}T12:00:00`));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={copy.calendarTitle} subtitle={copy.calendarSubtitle} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCalendar
          initialDate={visibleMonth}
          onMonthChange={(month) => setVisibleMonth(month.dateString)}
          onDayPress={(date) => setSelectedDate(date.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
        />
        <View style={styles.legend}>
          <LegendDot color={AppColors.expired} label={t.calendarLegendExpired} />
          <LegendDot color={AppColors.warning} label={t.calendarLegendSoon} />
          <LegendDot color={AppColors.good} label={t.calendarLegendGood} />
          <LegendDot color={RECIPE_DOT} label={copy.planned} />
        </View>
        <View style={styles.dayPanel}>
          <Text accessibilityRole="header" style={styles.dayTitle}>{dateLabel}</Text>
          {selectedPlans.length > 0 && <Text accessibilityRole="header" style={styles.daySection}>{copy.planned}</Text>}
          {selectedPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              accessibilityRole="button"
              accessibilityLabel={`${plan.recipe.name}, ${t.recipeServings(plan.servings)}${plan.reminderTime ? `, ${plan.reminderTime}` : ''}`}
              onPress={() => setOpenedPlan(plan)}
              style={styles.recipe}>
              <Ionicons name="restaurant-outline" color={RECIPE_DOT} size={21} />
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{plan.recipe.name}</Text>
                <Text style={styles.noneText}>
                  {[t.recipeServings(plan.servings), plan.reminderTime].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.primaryDark} />
            </TouchableOpacity>
          ))}
          {loadError && <Text accessibilityRole="alert" style={styles.noneText}>{t.saveError}</Text>}
          {!ready && !loadError && <ActivityIndicator color={AppColors.primaryDark} />}
          {selectedItems.length > 0 && <Text accessibilityRole="header" style={styles.daySection}>{t.pantryTitle}</Text>}
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
          {ready && selectedItems.length === 0 && selectedPlans.length === 0
            && <Text style={styles.noneText}>{copy.nothingOnDay}</Text>}
        </View>
      </ScrollView>
      {openedPlan && (
        <RecipeDetail
          recipe={openedPlan.recipe}
          initialServings={openedPlan.servings}
          onClose={() => setOpenedPlan(null)}
          onRemove={async () => {
            await removePlan(openedPlan.id);
            setOpenedPlan(null);
          }}
        />
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
  content: { paddingHorizontal: 24, paddingBottom: 28 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 10, marginVertical: 20, backgroundColor: AppColors.warmTint, borderRadius: 16, padding: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { fontSize: 12, color: AppColors.textLight },
  dayPanel: { ...AppStyles.card, backgroundColor: AppColors.limeTint, marginTop: 4, padding: 20 },
  dayTitle: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: AppColors.text, marginBottom: 12 },
  daySection: { fontSize: 14, lineHeight: 22, fontWeight: '600', color: AppColors.text, marginVertical: 8 },
  recipe: { ...AppStyles.card, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, minHeight: 56, marginBottom: 8 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: AppColors.text },
  dayItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  dayItemName: { flex: 1, fontSize: 15, lineHeight: 22, color: AppColors.text },
  noneText: { fontSize: 14, lineHeight: 21, color: AppColors.textLight },
});
