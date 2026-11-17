import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { kitchenCopy } from '@/store/kitchen-copy';

export default function KitchenLink({ kind }: { kind: 'shopping' | 'equipment' }) {
  const { language } = useI18n();
  const { equipment, shopping, loading, loadError } = useKitchen();
  const copy = kitchenCopy[language];
  const isShopping = kind === 'shopping';
  const subtitle = isShopping
    ? copy.toBuy(shopping.filter(item => !item.bought).length)
    : equipment.length ? copy.equipmentCount(equipment.length) : copy.noEquipment;

  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy[kind]} style={styles.link}
      onPress={() => router.push(isShopping ? '/shopping-list' : '/kitchen-equipment')}>
      <View style={styles.icon}>
        <Ionicons name={isShopping ? 'cart-outline' : 'construct-outline'} size={23} color={AppColors.avocadoText} />
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{copy[kind]}</Text>
        {!loading && !loadError && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={19} color={AppColors.primaryDark} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: { ...AppStyles.card, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  icon: { ...AppStyles.iconButton, borderRadius: 14 },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: AppColors.text },
  subtitle: { fontSize: 13, color: AppColors.textLight, marginTop: 3 },
});
