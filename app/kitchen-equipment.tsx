import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { equipmentGroups } from '@/lib/kitchen-equipment';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { equipmentLabel, kitchenCopy } from '@/store/kitchen-copy';
import { useTimers } from '@/store/timers';

export default function KitchenEquipmentScreen() {
  const { language, t } = useI18n();
  const copy = kitchenCopy[language];
  const { equipment, loading, loadError, toggleEquipment } = useKitchen();
  const { timers, hidden } = useTimers();
  const [saveError, setSaveError] = useState(false);

  return (
    <SafeAreaView style={AppStyles.screen}>
      <ScreenHeader title={copy.equipment} action={
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.back} style={AppStyles.iconButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')}>
          <Ionicons name="chevron-back" size={23} color={AppColors.avocadoText} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={[styles.content, !hidden && timers.length > 0 && styles.timerSpace]}>
        {loading ? <ActivityIndicator color={AppColors.primaryDark} /> : loadError ? (
          <Text accessibilityRole="alert" style={styles.error}>{copy.loadError}</Text>
        ) : (
          <>
            <Text style={styles.hint}>{copy.equipmentHint}</Text>
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {equipment.length > 0 ? copy.equipmentCount(equipment.length) : copy.noEquipment}
            </Text>
            {saveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
            {(['cooking', 'prep', 'tools'] as const).map(group => (
              <View key={group} style={styles.group}>
                <Text accessibilityRole="header" style={styles.heading}>{copy[group]}</Text>
                <View style={styles.options}>
                  {equipmentGroups[group].map(id => {
                    const checked = equipment.includes(id);
                    const label = equipmentLabel(id, language);
                    return (
                      <TouchableOpacity key={id} style={[styles.option, checked && styles.selected]}
                        accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} aria-checked={checked}
                        onPress={() => { setSaveError(false); void toggleEquipment(id).catch(() => setSaveError(true)); }}>
                        <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={AppColors.primaryDark} />
                        <Text style={styles.label}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  timerSpace: { paddingBottom: 148 },
  hint: { fontSize: 15, lineHeight: 22, color: AppColors.textLight },
  count: { fontSize: 14, fontWeight: '600', color: AppColors.primaryDark, marginTop: 6 },
  error: { fontSize: 14, color: AppColors.expired, marginTop: 8 },
  group: { gap: 10, marginTop: 22 },
  heading: { fontSize: 18, color: AppColors.text, fontWeight: '600' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { ...AppStyles.card, flexDirection: 'row', alignItems: 'center', minHeight: 48, maxWidth: '100%', gap: 7, paddingHorizontal: 10, borderColor: AppColors.border, borderRadius: 13 },
  selected: { backgroundColor: AppColors.limeTint, borderColor: AppColors.primaryLight },
  label: { flexShrink: 1, fontSize: 14, lineHeight: 19, color: AppColors.text },
});
