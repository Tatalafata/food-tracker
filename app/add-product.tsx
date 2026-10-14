import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { usePantry } from '@/store/pantry';

// ─── Date Picker Wheel ────────────────────────────────────────────────────────

const ITEM_H = 48;
const VISIBLE = 5; // must be odd
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  formatItem,
}: {
  data: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (v: number) => string;
}) {
  const ref = useRef<FlatList<number>>(null);

  useEffect(() => {
    setTimeout(() => {
      ref.current?.scrollToOffset({ offset: selectedIndex * ITEM_H, animated: false });
    }, 50);
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      onSelect(Math.max(0, Math.min(idx, data.length - 1)));
    },
    [data.length, onSelect],
  );

  return (
    <View style={styles.wheelCol}>
      {/* Selection highlight */}
      <View pointerEvents="none" style={styles.wheelHighlight} />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(item) => String(item)}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: index * ITEM_H, index })}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item, index }) => {
          const dist = Math.abs(index - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : 0.25;
          const isSelected = index === selectedIndex;
          return (
            <View style={styles.wheelItem}>
              <Text
                style={[
                  styles.wheelText,
                  isSelected && styles.wheelTextSelected,
                  { opacity },
                ]}>
                {formatItem(item)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

function DatePickerModal({
  visible,
  initialDate,
  onConfirm,
  onDismiss,
  confirmLabel,
  cancelLabel,
}: {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const now = new Date();
  const years = range(now.getFullYear(), now.getFullYear() + 15);
  const months = range(1, 12);

  const [yearIdx, setYearIdx] = useState(() =>
    Math.max(0, years.indexOf(initialDate.getFullYear())),
  );
  const [monthIdx, setMonthIdx] = useState(() => initialDate.getMonth()); // 0-based
  const [dayIdx, setDayIdx] = useState(() => initialDate.getDate() - 1);

  const selectedYear = years[yearIdx] ?? now.getFullYear();
  const selectedMonth = months[monthIdx] ?? 1;
  const maxDay = daysInMonth(selectedYear, selectedMonth);
  const days = range(1, maxDay);
  const clampedDayIdx = Math.min(dayIdx, maxDay - 1);

  const handleConfirm = () => {
    onConfirm(new Date(selectedYear, selectedMonth - 1, days[clampedDayIdx] ?? 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.pickerContainer}>
        <View style={styles.pickerSheet}>
          <View style={styles.wheelsRow}>
            <WheelColumn
              data={years}
              selectedIndex={yearIdx}
              onSelect={setYearIdx}
              formatItem={(v) => String(v)}
            />
            <WheelColumn
              data={months}
              selectedIndex={monthIdx}
              onSelect={setMonthIdx}
              formatItem={(v) => String(v).padStart(2, '0')}
            />
            <WheelColumn
              data={days}
              selectedIndex={clampedDayIdx}
              onSelect={setDayIdx}
              formatItem={(v) => String(v).padStart(2, '0')}
            />
          </View>
          <View style={styles.pickerActions}>
            <TouchableOpacity style={styles.pickerCancelBtn} onPress={onDismiss}>
              <Text style={styles.pickerCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerConfirmBtn} onPress={handleConfirm}>
              <Text style={styles.pickerConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add Product Screen ───────────────────────────────────────────────────────

export default function AddProductScreen() {
  const { addItem } = usePantry();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const formattedDate = selectedDate.toISOString().split('T')[0];

  async function handleAdd() {
    if (!name.trim()) {
      return;
    }
    setSaving(true);
    try {
      await addItem({
        name: name.trim(),
        expiryDate: noExpiry ? undefined : formattedDate,
      });
      setSuccess(true);
      setName('');
      setNoExpiry(false);
      setTimeout(() => {
        setSuccess(false);
        router.back();
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>{t.addProductSuccess(name || '…')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.addProductTitle}</Text>
        <View style={styles.closeBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t.addProductNameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.addProductNamePlaceholder}
            placeholderTextColor={AppColors.textLight}
            returnKeyType="done"
            autoFocus
          />

          {/* No Expiry Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{t.addProductNoExpiry}</Text>
              <Text style={styles.toggleSubtitle}>e.g. Salt, Spices, Honey</Text>
            </View>
            <Switch
              value={noExpiry}
              onValueChange={setNoExpiry}
              trackColor={{ false: AppColors.border, true: AppColors.primaryLight }}
              thumbColor={noExpiry ? AppColors.primary : '#f4f3f4'}
            />
          </View>

          {!noExpiry && (
            <>
              <Text style={styles.label}>{t.addProductExpiryLabel}</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}>
                <Text style={styles.datePickerText}>{formattedDate}</Text>
                <Text style={styles.datePickerIcon}>📅</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.addBtn, (!name.trim() || saving) && styles.addBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.8}
            disabled={!name.trim() || saving}>
            <Text style={styles.addBtnText}>{t.addProductAddBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={pickerVisible}
        initialDate={selectedDate}
        onConfirm={(date) => {
          setSelectedDate(date);
          setPickerVisible(false);
        }}
        onDismiss={() => setPickerVisible(false)}
        confirmLabel={t.addProductConfirm}
        cancelLabel={t.addProductCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: AppColors.primary,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  form: { padding: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.textLight, marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 12,
    padding: 14, fontSize: 16, color: AppColors.text, backgroundColor: AppColors.white,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: AppColors.white, borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: AppColors.border,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  toggleSubtitle: { fontSize: 12, color: AppColors.textLight, marginTop: 2 },
  datePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 12,
    padding: 14, backgroundColor: AppColors.white,
  },
  datePickerText: { fontSize: 16, color: AppColors.text, fontWeight: '500' },
  datePickerIcon: { fontSize: 20 },
  addBtn: {
    backgroundColor: AppColors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 32,
  },
  addBtnDisabled: { backgroundColor: AppColors.textLight },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: AppColors.goodBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  successCheck: { fontSize: 36, color: AppColors.good },
  successTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text },
  // Wheel picker
  pickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  wheelsRow: {
    flexDirection: 'row', height: ITEM_H * VISIBLE,
    paddingHorizontal: 16, marginTop: 8,
  },
  wheelCol: { flex: 1, overflow: 'hidden', position: 'relative' },
  wheelHighlight: {
    position: 'absolute', left: 4, right: 4,
    top: ITEM_H * Math.floor(VISIBLE / 2),
    height: ITEM_H,
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: AppColors.primary,
    borderRadius: 4,
  },
  wheelItem: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  wheelText: { fontSize: 20, color: AppColors.textLight, fontWeight: '400' },
  wheelTextSelected: { color: AppColors.text, fontWeight: '700', fontSize: 22 },
  pickerActions: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  pickerCancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: AppColors.border, alignItems: 'center',
  },
  pickerCancelText: { fontSize: 15, color: AppColors.textLight, fontWeight: '600' },
  pickerConfirmBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    backgroundColor: AppColors.primary, alignItems: 'center',
  },
  pickerConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
