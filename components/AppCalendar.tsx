import { StyleSheet } from 'react-native';
import { Calendar, CalendarProps, LocaleConfig } from 'react-native-calendars';

import { AppColors, AppStyles } from '@/constants/theme';
import { LANGUAGE_OPTIONS, useI18n } from '@/store/i18n';

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

export default function AppCalendar(props: CalendarProps) {
  const { language } = useI18n();
  LocaleConfig.defaultLocale = language;
  return <Calendar key={language} theme={calendarTheme} style={styles.calendar} {...props} />;
}

const styles = StyleSheet.create({
  calendar: { ...AppStyles.card, padding: 10, overflow: 'hidden' },
});
