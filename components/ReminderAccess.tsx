import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { useNotificationPrefs } from '@/store/notifications';
import { planningCopy } from '@/store/planning-copy';

export default function ReminderAccess() {
  const { language } = useI18n();
  const { allowed, canAsk, requestPermission } = useNotificationPrefs();
  const copy = planningCopy[language];

  if (Platform.OS === 'web') return <Text style={styles.note}>{copy.webReminders}</Text>;
  if (allowed) return null;

  return (
    <View>
      {!canAsk && <Text style={styles.note}>{copy.permissionDenied}</Text>}
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.action}
        onPress={() => canAsk ? void requestPermission() : void Linking.openSettings().catch(() => {})}>
        <Text style={styles.actionText}>{canAsk ? copy.enableNotifications : copy.deviceSettings}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: AppColors.textLight, fontSize: 13, lineHeight: 20, marginVertical: 8 },
  action: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center' },
  actionText: { color: AppColors.primaryDark, fontSize: 14, fontWeight: '600' },
});
