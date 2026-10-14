import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpiryBadge from '@/components/ExpiryBadge';
import OnboardingModal from '@/components/OnboardingModal';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, getExpiryStatus, usePantry } from '@/store/pantry';

function Stat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statCount}>{count}</Text>
      <View style={styles.statCaption}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { items, loading, bulkAddItems } = usePantry();
  const { t } = useI18n();
  const { expiredCount, warnCount, goodCount, urgentItems } = useMemo(() => {
    let expiredCount = 0, warnCount = 0, goodCount = 0;
    items.forEach((item) => {
      const status = getExpiryStatus(item.expiryDate);
      if (status === 'expired') expiredCount++;
      else if (status === 'warning') warnCount++;
      else if (status === 'good') goodCount++;
    });
    const urgentItems = items
      .filter((item) => item.expiryDate && getDaysUntilExpiry(item.expiryDate) <= 3)
      .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));
    return { expiredCount, warnCount, goodCount, urgentItems };
  }, [items]);

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={AppColors.primaryDark} /></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <OnboardingModal bulkAddItems={bulkAddItems} />
      <FlatList
        data={urgentItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <ScreenHeader title="ChefSuggest" subtitle={t.homeSubtitle(items.length)} icon="leaf-outline" />
            <View style={styles.overview}>
              <View style={styles.overviewHeading}>
                <Text style={styles.overviewTitle}>{t.pantryTitle}</Text>
                <Ionicons name="basket-outline" size={22} color={AppColors.avocadoText} />
              </View>
              <View style={styles.statsRow}>
                <Stat label={t.homeExpired} count={expiredCount} color={AppColors.expired} />
                <View style={styles.statDivider} />
                <Stat label={t.homeExpiringSoon} count={warnCount} color={AppColors.warning} />
                <View style={styles.statDivider} />
                <Stat label={t.homeGood} count={goodCount} color={AppColors.good} />
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.addAction} onPress={() => router.push('/add-product')} activeOpacity={0.75} accessibilityRole="button">
                <Ionicons name="add" size={21} color={AppColors.avocadoText} />
                <Text style={styles.addActionText}>{t.addProductTitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanAction} onPress={() => router.push('/scanner')} activeOpacity={0.75} accessibilityRole="button">
                <Ionicons name="scan-outline" size={21} color={AppColors.avocadoText} />
                <Text style={styles.scanActionText}>{t.tabScan}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{urgentItems.length > 0 ? t.homeNeedsAttention : t.homeAllGood}</Text>
              {urgentItems.length > 0 && <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{urgentItems.length}</Text></View>}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyMark}><Ionicons name="leaf-outline" size={30} color={AppColors.primaryDark} /></View>
            <Text style={styles.emptyText}>{t.homeNothingExpiring}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemDate}>{item.expiryDate}</Text>
              <ExpiryBadge expiryDate={item.expiryDate} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { ...AppStyles.screen, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 28 },
  overview: { backgroundColor: AppColors.avocado, borderRadius: 26, marginHorizontal: 24, padding: 20 },
  overviewHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  overviewTitle: { fontSize: 16, fontWeight: '500', color: AppColors.avocadoText },
  statsRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 22 },
  stat: { flex: 1, paddingHorizontal: 2 },
  statCount: { fontSize: 34, fontWeight: '500', letterSpacing: -1, color: AppColors.avocadoText },
  statCaption: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statLabel: { flex: 1, fontSize: 12, lineHeight: 17, color: AppColors.avocadoText },
  dot: { width: 5, height: 5, borderRadius: 3 },
  statDivider: { width: 1, backgroundColor: 'rgba(41,75,53,0.12)', marginHorizontal: 12 },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 24, marginTop: 16, marginBottom: 30 },
  addAction: { ...AppStyles.button, flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  addActionText: { ...AppStyles.buttonText, flexShrink: 1, textAlign: 'center', fontSize: 14 },
  scanAction: { ...AppStyles.button, backgroundColor: AppColors.warmTint, flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  scanActionText: { fontSize: 14, fontWeight: '500', color: AppColors.avocadoText },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 24, marginBottom: 16 },
  sectionTitle: { flex: 1, fontSize: 21, fontWeight: '600', letterSpacing: -0.5, color: AppColors.text },
  sectionCount: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: AppColors.warmTint },
  sectionCountText: { fontSize: 13, fontWeight: '600', color: AppColors.avocadoText },
  itemCard: { ...AppStyles.card, padding: 18, marginHorizontal: 24, marginBottom: 10 },
  itemName: { fontSize: 16, fontWeight: '600', color: AppColors.text, lineHeight: 22 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  itemDate: { fontSize: 12, color: AppColors.textLight },
  emptyCard: { ...AppStyles.card, marginHorizontal: 24, padding: 28, alignItems: 'center' },
  emptyMark: { width: 64, height: 64, borderRadius: 24, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, lineHeight: 22, color: AppColors.textLight, marginTop: 16, textAlign: 'center' },
});
