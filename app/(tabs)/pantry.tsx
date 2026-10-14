import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpiryBadge from '@/components/ExpiryBadge';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, PantryItem, usePantry } from '@/store/pantry';

export default function PantryScreen() {
  const { items, removeItem, loading } = usePantry();
  const { t } = useI18n();
  const [pendingDelete, setPendingDelete] = useState<PantryItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);
  const sorted = useMemo(() => [...items].sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)), [items]);

  async function confirmDelete() {
    if (!pendingDelete || removing) return;
    setRemoving(true);
    setRemoveError(false);
    try {
      await removeItem(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setRemoveError(true);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={AppColors.primaryDark} /></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.pantryTitle} subtitle={t.pantrySubtitle(items.length)} action={
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-product')} accessibilityRole="button" accessibilityLabel={t.addProductTitle}>
          <Ionicons name="add" size={25} color={AppColors.onPrimary} />
        </TouchableOpacity>
      } />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyMark}><Ionicons name="basket-outline" size={32} color={AppColors.primaryDark} /></View>
            <Text style={styles.emptyTitle}>{t.pantryEmptyTitle}</Text>
            <Text style={styles.emptyText}>{t.pantryEmptyText}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.expiryDate && <Text style={styles.itemDate}>{t.pantryBestBefore} {item.expiryDate}</Text>}
              <View style={styles.badgeSpace}><ExpiryBadge expiryDate={item.expiryDate} /></View>
            </View>
            <TouchableOpacity style={AppStyles.iconButton} onPress={() => { setRemoveError(false); setPendingDelete(item); }} accessibilityRole="button" accessibilityLabel={t.pantryRemove + ': ' + item.name}>
              <Ionicons name="trash-outline" size={19} color={AppColors.textLight} />
            </TouchableOpacity>
          </View>
        )}
      />
      <Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => !removing && setPendingDelete(null)}>
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.modalCard}>
            <Text accessibilityRole="header" style={styles.modalTitle}>{t.pantryRemoveTitle}</Text>
            <Text style={styles.modalText}>{t.pantryRemoveConfirm(pendingDelete?.name ?? '')}</Text>
            {removeError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingDelete(null)} disabled={removing} accessibilityRole="button"><Text style={styles.cancelText}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={confirmDelete} disabled={removing} accessibilityRole="button">
                {removing ? <ActivityIndicator color={AppColors.expired} /> : <Text style={styles.removeText}>{t.pantryRemove}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { ...AppStyles.screen, justifyContent: 'center', alignItems: 'center' },
  addBtn: { ...AppStyles.iconButton, backgroundColor: AppColors.primary },
  list: { paddingHorizontal: 24, paddingBottom: 28, flexGrow: 1 },
  card: { ...AppStyles.card, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, marginBottom: 12 },
  cardBody: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: AppColors.text },
  itemDate: { fontSize: 12, lineHeight: 18, color: AppColors.textLight, marginTop: 4 },
  badgeSpace: { marginTop: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  emptyMark: { width: 80, height: 80, borderRadius: 28, backgroundColor: AppColors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 21, fontWeight: '600', color: AppColors.text, marginTop: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 21, color: AppColors.textLight, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(29,44,34,0.28)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { ...AppStyles.card, width: '100%', maxWidth: 420, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text },
  modalText: { fontSize: 15, lineHeight: 23, color: AppColors.textLight, marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: { ...AppStyles.button, flex: 1, backgroundColor: AppColors.surfaceTint },
  cancelText: { ...AppStyles.buttonText },
  removeBtn: { ...AppStyles.button, flex: 1, backgroundColor: AppColors.expiredBg },
  removeText: { ...AppStyles.buttonText, color: AppColors.expired },
  error: { color: AppColors.expired, fontSize: 14, lineHeight: 20, marginTop: 12 },
});
