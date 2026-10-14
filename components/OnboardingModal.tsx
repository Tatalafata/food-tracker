import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { PantryItem } from '@/store/pantry';

const ONBOARDED_KEY = '@chefsuggest:onboarded';

// ─── Starter items always added on first launch ───────────────────────────────

interface StarterItem {
  name: string;
  expiryDate?: string;
  expiryLabel: string; // display only
}

function addMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

const STARTER_ITEMS: StarterItem[] = [
  { name: 'Plain Flour', expiryDate: addMonths(12), expiryLabel: '~12 months' },
  { name: 'Salt', expiryDate: undefined, expiryLabel: 'No expiry' },
  { name: 'Olive Oil', expiryDate: addMonths(18), expiryLabel: '~18 months' },
];

// ─── Extra staple chips ───────────────────────────────────────────────────────

interface StapleItem {
  id: string;
  name: string;
  category: string;
  monthsUntilExpiry?: number;
}

const STAPLES: StapleItem[] = [
  { id: 's1', name: 'Black Pepper', category: 'spices', monthsUntilExpiry: 36 },
  { id: 's2', name: 'Paprika', category: 'spices', monthsUntilExpiry: 24 },
  { id: 's3', name: 'Cumin', category: 'spices', monthsUntilExpiry: 24 },
  { id: 's4', name: 'Oregano', category: 'spices', monthsUntilExpiry: 24 },
  { id: 's5', name: 'Garlic Powder', category: 'spices', monthsUntilExpiry: 24 },
  { id: 's6', name: 'Chilli Flakes', category: 'spices', monthsUntilExpiry: 24 },
  { id: 'b1', name: 'Sugar', category: 'baking', monthsUntilExpiry: 48 },
  { id: 'b2', name: 'Brown Sugar', category: 'baking', monthsUntilExpiry: 24 },
  { id: 'b3', name: 'Baking Powder', category: 'baking', monthsUntilExpiry: 12 },
  { id: 'b4', name: 'Baking Soda', category: 'baking', monthsUntilExpiry: 18 },
  { id: 'b5', name: 'Vanilla Extract', category: 'baking', monthsUntilExpiry: 48 },
  { id: 'o1', name: 'Vegetable Oil', category: 'oils', monthsUntilExpiry: 12 },
  { id: 'o2', name: 'Apple Cider Vinegar', category: 'oils', monthsUntilExpiry: 60 },
  { id: 'o3', name: 'Balsamic Vinegar', category: 'oils', monthsUntilExpiry: 36 },
  { id: 'd1', name: 'Pasta', category: 'dry', monthsUntilExpiry: 24 },
  { id: 'd2', name: 'Rice', category: 'dry', monthsUntilExpiry: 48 },
  { id: 'd3', name: 'Canned Tomatoes', category: 'dry', monthsUntilExpiry: 24 },
  { id: 'd4', name: 'Lentils', category: 'dry', monthsUntilExpiry: 36 },
  { id: 'd5', name: 'Chickpeas (canned)', category: 'dry', monthsUntilExpiry: 24 },
  { id: 'd6', name: 'Oats', category: 'dry', monthsUntilExpiry: 12 },
  { id: 'c1', name: 'Soy Sauce', category: 'condiments', monthsUntilExpiry: 36 },
  { id: 'c2', name: 'Ketchup', category: 'condiments', monthsUntilExpiry: 12 },
  { id: 'c3', name: 'Mustard', category: 'condiments', monthsUntilExpiry: 12 },
  { id: 'c4', name: 'Honey', category: 'condiments' }, // no expiry
];

interface Props {
  bulkAddItems: (items: Omit<PantryItem, 'id' | 'addedDate'>[]) => Promise<void>;
}

export default function OnboardingModal({ bulkAddItems }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dismiss = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    setVisible(false);
  };

  const handleGetStarted = async () => {
    const toAdd: Omit<PantryItem, 'id' | 'addedDate'>[] = [
      // Always add the 3 starters
      ...STARTER_ITEMS.map((s) => ({ name: s.name, expiryDate: s.expiryDate })),
      // Plus any selected extra chips
      ...STAPLES.filter((s) => selected.has(s.id)).map((s) => ({
        name: s.name,
        expiryDate: s.monthsUntilExpiry ? addMonths(s.monthsUntilExpiry) : undefined,
      })),
    ];
    await bulkAddItems(toAdd);
    await dismiss();
  };

  const handleAddOwn = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    setVisible(false);
    router.push('/add-product' as never);
  };

  const categories = [
    { key: 'spices', label: t.onboardingCategorySpices },
    { key: 'baking', label: t.onboardingCategoryBaking },
    { key: 'oils', label: t.onboardingCategoryOils },
    { key: 'dry', label: t.onboardingCategoryDryGoods },
    { key: 'condiments', label: t.onboardingCategoryCondiments },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t.onboardingTitle}</Text>
          <Text style={styles.subtitle}>{t.onboardingSubtitle}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Starter items */}
            <View style={styles.starterSection}>
              <Text style={styles.starterTitle}>{t.onboardingStarterTitle}</Text>
              <Text style={styles.starterSubtitle}>{t.onboardingStarterSubtitle}</Text>
              <View style={styles.starterRow}>
                {STARTER_ITEMS.map((item) => (
                  <View key={item.name} style={styles.starterCard}>
                    <Text style={styles.starterName}>{item.name}</Text>
                    <Text style={styles.starterExpiry}>{item.expiryLabel}</Text>
                    <View style={[styles.starterBadge, !item.expiryDate && styles.starterBadgeNone]}>
                      <Text style={[styles.starterBadgeText, !item.expiryDate && styles.starterBadgeTextNone]}>
                        {item.expiryDate ? '📅' : '∞'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Extra staple chips */}
            <Text style={styles.moreTitle}>{t.onboardingMoreTitle}</Text>
            {categories.map((cat) => {
              const catItems = STAPLES.filter((s) => s.category === cat.key);
              return (
                <View key={cat.key} style={styles.category}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <View style={styles.chips}>
                    {catItems.map((item) => {
                      const active = selected.has(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => toggle(item.id)}
                          activeOpacity={0.7}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <View style={styles.scrollPad} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleGetStarted} activeOpacity={0.8}>
              <Text style={styles.getStartedText}>
                {selected.size > 0 ? t.onboardingAdd(selected.size) : t.onboardingDone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addOwnBtn} onPress={handleAddOwn} activeOpacity={0.8}>
              <Text style={styles.addOwnText}>{t.onboardingAddOwn}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={dismiss} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t.onboardingSkip}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd',
    alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: AppColors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginTop: 4, marginBottom: 16,
  },
  scroll: { flex: 1 },
  scrollPad: { height: 8 },

  // Starter items
  starterSection: {
    backgroundColor: AppColors.goodBg, borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1.5, borderColor: AppColors.border,
  },
  starterTitle: { fontSize: 14, fontWeight: '700', color: AppColors.primary, marginBottom: 2 },
  starterSubtitle: { fontSize: 12, color: AppColors.textLight, marginBottom: 12 },
  starterRow: { flexDirection: 'row', gap: 10 },
  starterCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  starterName: { fontSize: 13, fontWeight: '700', color: AppColors.text, textAlign: 'center' },
  starterExpiry: { fontSize: 10, color: AppColors.textLight, marginTop: 3, textAlign: 'center' },
  starterBadge: {
    marginTop: 8, backgroundColor: AppColors.goodBg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  starterBadgeNone: { backgroundColor: AppColors.border },
  starterBadgeText: { fontSize: 14 },
  starterBadgeTextNone: { fontSize: 14 },

  // Extra chips
  moreTitle: {
    fontSize: 15, fontWeight: '700', color: AppColors.text, marginBottom: 14,
  },
  category: { marginBottom: 16 },
  categoryLabel: {
    fontSize: 12, fontWeight: '700', color: AppColors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1.5, borderColor: AppColors.border,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, color: AppColors.text, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // Footer
  footer: { paddingVertical: 12, paddingBottom: 28, gap: 10 },
  getStartedBtn: {
    backgroundColor: AppColors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  getStartedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addOwnBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: AppColors.primary,
  },
  addOwnText: { color: AppColors.primary, fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { fontSize: 13, color: AppColors.textLight },
});
