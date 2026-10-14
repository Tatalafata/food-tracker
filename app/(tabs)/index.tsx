import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import OnboardingModal from '@/components/OnboardingModal';
import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { getDaysUntilExpiry, getExpiryStatus, usePantry } from '@/store/pantry';

function StatCard({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ExpiryBadge({ expiryDate }: { expiryDate?: string }) {
  const { t } = useI18n();
  if (!expiryDate) {
    return (
      <View style={[styles.badge, { backgroundColor: AppColors.border }]}>
        <Text style={[styles.badgeText, { color: AppColors.textLight }]}>{t.noExpiryDate}</Text>
      </View>
    );
  }
  const days = getDaysUntilExpiry(expiryDate);
  const status = getExpiryStatus(expiryDate);
  const color = status === 'expired' ? AppColors.expired : status === 'warning' ? AppColors.warning : AppColors.good;
  const bg = status === 'expired' ? AppColors.expiredBg : status === 'warning' ? AppColors.warningBg : AppColors.goodBg;
  const label =
    days < 0 ? t.labelExpiredAgo(Math.abs(days))
    : days === 0 ? t.labelExpiresToday
    : days === 1 ? t.labelTomorrow
    : t.labelDays(days);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { items, loading, bulkAddItems } = usePantry();
  const { t } = useI18n();

  const { expiredCount, warnCount, goodCount, urgentItems } = useMemo(() => {
    let expiredCount = 0, warnCount = 0, goodCount = 0;
    items.forEach((i) => {
      const s = getExpiryStatus(i.expiryDate);
      if (s === 'expired') expiredCount++;
      else if (s === 'warning') warnCount++;
      else if (s === 'good') goodCount++;
      // 'none' (no expiry) items are not counted in stats
    });
    const urgentItems = items
      .filter((i) => i.expiryDate && getDaysUntilExpiry(i.expiryDate) <= 3)
      .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));
    return { expiredCount, warnCount, goodCount, urgentItems };
  }, [items]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingModal bulkAddItems={bulkAddItems} />
      <View style={styles.header}>
        <Text style={styles.appName}>ChefSuggest</Text>
        <Text style={styles.subtitle}>{t.homeSubtitle(items.length)}</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label={t.homeExpired} count={expiredCount} color={AppColors.expired} bg={AppColors.expiredBg} />
        <StatCard label={t.homeExpiringSoon} count={warnCount} color={AppColors.warning} bg={AppColors.warningBg} />
        <StatCard label={t.homeGood} count={goodCount} color={AppColors.good} bg={AppColors.goodBg} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {urgentItems.length > 0 ? t.homeNeedsAttention : t.homeAllGood}
        </Text>

        {urgentItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyText}>{t.homeNothingExpiring}</Text>
          </View>
        ) : (
          <FlatList
            data={urgentItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDate}>{item.expiryDate}</Text>
                </View>
                <ExpiryBadge expiryDate={item.expiryDate} />
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/scanner' as never)}
        activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary },
  appName: { fontSize: 28, fontWeight: '800', color: AppColors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  statCard: {
    flex: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statCount: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  section: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: AppColors.text, marginBottom: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white,
    borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  itemDate: { fontSize: 12, color: AppColors.textLight, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { backgroundColor: AppColors.white, borderRadius: 12, padding: 28, alignItems: 'center' },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: AppColors.textLight, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 30, color: AppColors.white, lineHeight: 34 },
});
