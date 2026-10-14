import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, getExpiryStatus } from '@/store/pantry';

export default function ExpiryBadge({ expiryDate }: { expiryDate?: string }) {
  const { t } = useI18n();
  const status = getExpiryStatus(expiryDate);
  const days = getDaysUntilExpiry(expiryDate);
  const color = status === 'expired' ? AppColors.expired : status === 'warning' ? AppColors.warning : status === 'good' ? AppColors.good : AppColors.textLight;
  const bg = status === 'expired' ? AppColors.expiredBg : status === 'warning' ? AppColors.warningBg : AppColors.surfaceTint;
  const label = !expiryDate ? t.noExpiryDate : days < 0 ? t.labelExpiredAgo(Math.abs(days)) : days === 0 ? t.labelExpiresToday : days === 1 ? t.labelTomorrow : t.labelDaysLeft(days);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 12, lineHeight: 17, fontWeight: '500', flexShrink: 1 },
});
