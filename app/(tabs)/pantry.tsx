import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, getExpiryStatus, usePantry } from '@/store/pantry';

export default function PantryScreen() {
  const { items, removeItem, loading } = usePantry();
  const { t } = useI18n();

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const dA = a.expiryDate ? getDaysUntilExpiry(a.expiryDate) : Infinity;
        const dB = b.expiryDate ? getDaysUntilExpiry(b.expiryDate) : Infinity;
        return dA - dB;
      }),
    [items],
  );

  function confirmDelete(id: string, name: string) {
    Alert.alert(t.pantryRemoveTitle, t.pantryRemoveConfirm(name), [
      { text: t.cancel, style: 'cancel' },
      { text: t.pantryRemove, style: 'destructive', onPress: () => removeItem(id) },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.pantryTitle}</Text>
          <Text style={styles.subtitle}>{t.pantrySubtitle(items.length)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-product' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t.pantryEmptyTitle}</Text>
          <Text style={styles.emptyText}>{t.pantryEmptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const hasExpiry = !!item.expiryDate;
            const status = getExpiryStatus(item.expiryDate);
            const isNone = status === 'none';

            const color =
              isNone ? AppColors.textLight
              : status === 'expired' ? AppColors.expired
              : status === 'warning' ? AppColors.warning
              : AppColors.good;

            const bg =
              isNone ? AppColors.border
              : status === 'expired' ? AppColors.expiredBg
              : status === 'warning' ? AppColors.warningBg
              : AppColors.goodBg;

            let daysLabel = t.noExpiryDate;
            if (hasExpiry) {
              const days = getDaysUntilExpiry(item.expiryDate!);
              daysLabel =
                days < 0 ? t.labelExpiredAgo(Math.abs(days))
                : days === 0 ? t.labelExpiresToday
                : days === 1 ? t.labelTomorrow
                : t.labelDaysLeft(days);
            }

            return (
              <View style={[styles.card, { borderLeftColor: color }]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDate}>
                    {hasExpiry ? `${t.pantryBestBefore} ${item.expiryDate}` : t.noExpiryDate}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.statusText, { color }]}>{daysLabel}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(item.id, item.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary,
  },
  title: { fontSize: 24, fontWeight: '700', color: AppColors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { fontSize: 24, color: AppColors.white, lineHeight: 28 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  cardBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  itemDate: { fontSize: 12, color: AppColors.textLight, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 11, color: '#999' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: AppColors.textLight, marginTop: 6, textAlign: 'center' },
});
