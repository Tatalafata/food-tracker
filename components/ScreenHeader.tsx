import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';

export default function ScreenHeader({ title, subtitle, icon, action }: {
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {icon && <View style={styles.mark}><Ionicons name={icon} size={24} color={AppColors.primaryDark} /></View>}
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 24 },
  mark: { width: 48, height: 48, borderRadius: 18, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 27, fontWeight: '600', color: AppColors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 20, color: AppColors.textLight, marginTop: 5 },
});
