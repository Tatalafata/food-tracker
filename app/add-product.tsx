import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { localDateKey, localReminderDate } from '@/lib/local-date';
import { useI18n } from '@/store/i18n';
import { PantryItem, usePantry } from '@/store/pantry';

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
  label,
  data,
  selectedIndex,
  onSelect,
  formatItem,
}: {
  label: string;
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
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelTrack}>
        {/* Selection highlight */}
        <View pointerEvents="none" style={styles.wheelHighlight} />
        <FlatList
          ref={ref}
          data={data}
          initialScrollIndex={selectedIndex}
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
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={label + ': ' + formatItem(item)} accessibilityState={{ selected: isSelected }} aria-selected={isSelected} style={styles.wheelItem} onPress={() => onSelect(index)}>
                <Text
                  style={[
                    styles.wheelText,
                    isSelected && styles.wheelTextSelected,
                    { opacity },
                  ]}>
                  {formatItem(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
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
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const firstYear = Math.min(now.getFullYear(), initialDate.getFullYear());
  const years = range(firstYear, Math.max(now.getFullYear() + 15, initialDate.getFullYear()));
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

  useEffect(() => {
    if (!visible) return;
    setYearIdx(Math.max(0, initialDate.getFullYear() - firstYear));
    setMonthIdx(initialDate.getMonth());
    setDayIdx(initialDate.getDate() - 1);
  }, [visible, initialDate, firstYear]);

  const handleConfirm = () => {
    onConfirm(new Date(selectedYear, selectedMonth - 1, days[clampedDayIdx] ?? 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.pickerContainer}>
        <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.wheelsRow}>
            <WheelColumn
              label={t.dateYear}
              data={years}
              selectedIndex={yearIdx}
              onSelect={setYearIdx}
              formatItem={(v) => String(v)}
            />
            <WheelColumn
              label={t.dateMonth}
              data={months}
              selectedIndex={monthIdx}
              onSelect={setMonthIdx}
              formatItem={(v) => String(v).padStart(2, '0')}
            />
            <WheelColumn
              label={t.dateDay}
              data={days}
              selectedIndex={clampedDayIdx}
              onSelect={setDayIdx}
              formatItem={(v) => String(v).padStart(2, '0')}
            />
          </View>
          <View style={styles.pickerActions}>
            <TouchableOpacity accessibilityRole="button" style={styles.pickerCancelBtn} onPress={onDismiss}>
              <Text style={styles.pickerCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.pickerConfirmBtn} onPress={handleConfirm}>
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { items, loading } = usePantry();
  const { t } = useI18n();
  const item = typeof id === 'string' ? items.find(product => product.id === id) : undefined;

  if (id && loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={AppColors.primaryDark} /></SafeAreaView>;
  }
  if (id && !item) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.label}>{t.productEdit.missing}</Text>
        <TouchableOpacity accessibilityRole="button" style={AppStyles.button} onPress={closeProductForm}>
          <Text style={AppStyles.buttonText}>{t.cancel}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  return <ProductForm key={item?.id ?? 'new'} item={item} />;
}

function closeProductForm() {
  if (router.canGoBack()) router.back();
  else router.replace('/pantry');
}

function ProductForm({ item }: { item?: PantryItem }) {
  const { addItem, updateItem } = usePantry();
  const { t } = useI18n();
  const [name, setName] = useState(item?.name ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [barcode, setBarcode] = useState(item?.barcode ?? '');
  const [noExpiry, setNoExpiry] = useState(!!item && !item.expiryDate);
  const [formattedDate, setFormattedDate] = useState(() => {
    if (item?.expiryDate) return item.expiryDate;
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return localDateKey(d);
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [saveError, setSaveError] = useState(false);

  const pickerDate = useMemo(() => localReminderDate(formattedDate, '12:00') ?? new Date(), [formattedDate]);

  async function handleSave() {
    if (!name.trim() || saving) {
      return;
    }
    setSaveError(false);
    setSaving(true);
    try {
      const fields = {
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        expiryDate: noExpiry ? undefined : formattedDate,
        notes: notes.trim() || undefined,
      };
      if (item) {
        await updateItem(item.id, fields);
        closeProductForm();
        return;
      }
      await addItem(fields);
      setSavedName(name.trim());
      setSuccess(true);
      setName('');
      setNoExpiry(false);
      setTimeout(() => {
        setSuccess(false);
        closeProductForm();
      }, 1200);
    } catch {
      setSaveError(true);
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
        <Text style={styles.successTitle}>{t.addProductSuccess(savedName)}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={AppStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.cancel} disabled={saving} onPress={closeProductForm} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={AppColors.textLight} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.headerTitle}>{item ? t.productEdit.title : t.addProductTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t.addProductNameLabel}</Text>
          <TextInput
            accessibilityLabel={t.addProductNameLabel}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.addProductNamePlaceholder}
            placeholderTextColor={AppColors.textLight}
            returnKeyType="done"
            autoFocus={!item}
            editable={!saving}
          />

          {/* No Expiry Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{t.addProductNoExpiry}</Text>
              <Text style={styles.toggleSubtitle}>{t.addProductNoExpiryHint}</Text>
            </View>
            <Switch
              accessibilityLabel={t.addProductNoExpiry}
              disabled={saving}
              value={noExpiry}
              onValueChange={setNoExpiry}
              trackColor={{ false: AppColors.border, true: AppColors.avocado }}
              thumbColor={AppColors.white}
            />
          </View>

          {!noExpiry && (
            <>
              <Text style={styles.label}>{t.addProductExpiryLabel}</Text>
              <TouchableOpacity
                style={styles.datePicker}
                accessibilityRole="button"
                accessibilityLabel={t.addProductPickDate + ': ' + formattedDate}
                disabled={saving}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}>
                <Text style={styles.datePickerText}>{formattedDate}</Text>
                <Ionicons name="calendar-outline" size={21} color={AppColors.primaryDark} />
              </TouchableOpacity>
            </>
          )}

          {item && (
            <>
              <Text style={styles.label}>{t.productEdit.barcode}</Text>
              <TextInput
                accessibilityLabel={t.productEdit.barcode}
                style={styles.input}
                value={barcode}
                onChangeText={setBarcode}
                editable={!saving}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
          <Text style={styles.label}>{t.productEdit.notes}</Text>
          <TextInput
            accessibilityLabel={t.productEdit.notes}
            style={[styles.input, styles.notes]}
            value={notes}
            onChangeText={setNotes}
            editable={!saving}
            multiline
          />

          {saveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.addBtn, (!name.trim() || saving) && styles.addBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!name.trim() || saving}>
            {saving ? <ActivityIndicator color={AppColors.onPrimary} /> : <Text style={styles.addBtnText}>{item ? t.save : t.addProductAddBtn}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={pickerVisible}
        initialDate={pickerDate}
        onConfirm={(date) => {
          setFormattedDate(localDateKey(date));
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
  center: { ...AppStyles.screen, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', letterSpacing: -0.4, color: AppColors.text, textAlign: 'center', marginHorizontal: 8 },
  closeBtn: { ...AppStyles.iconButton },
  headerSpacer: { width: 48, height: 48 },
  form: { padding: 24, paddingTop: 0, paddingBottom: 40, gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: AppColors.text, marginTop: 24, marginBottom: 10 },
  input: { ...AppStyles.input },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  toggleRow: { ...AppStyles.card, backgroundColor: AppColors.limeTint, flexDirection: 'row', alignItems: 'center', marginTop: 24, padding: 20, gap: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, lineHeight: 22, fontWeight: '500', color: AppColors.text },
  toggleSubtitle: { fontSize: 13, lineHeight: 19, color: AppColors.textLight, marginTop: 6 },
  datePicker: { ...AppStyles.input, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePickerText: { fontSize: 16, color: AppColors.text, fontWeight: '400' },
  addBtn: { ...AppStyles.button, marginTop: 32 },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...AppStyles.buttonText },
  error: { fontSize: 14, lineHeight: 21, color: AppColors.expired, marginTop: 20 },
  successCircle: { width: 96, height: 96, borderRadius: 32, backgroundColor: AppColors.goodBg, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successCheck: { fontSize: 40, color: AppColors.good },
  successTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text, textAlign: 'center' },
  pickerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(29,44,34,0.28)' },
  pickerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxWidth: 640, alignSelf: 'center', paddingTop: 12 },
  wheelsRow: { flexDirection: 'row', height: ITEM_H * VISIBLE + 32, paddingHorizontal: 24, marginTop: 8 },
  wheelCol: { flex: 1 },
  wheelLabel: { fontSize: 13, lineHeight: 20, color: AppColors.textLight, textAlign: 'center', marginBottom: 12 },
  wheelTrack: { flex: 1, overflow: 'hidden', position: 'relative' },
  wheelHighlight: { position: 'absolute', left: 4, right: 4, top: ITEM_H * Math.floor(VISIBLE / 2), height: ITEM_H, backgroundColor: AppColors.avocado, borderRadius: 14 },
  wheelItem: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  wheelText: { fontSize: 20, color: AppColors.textLight, fontWeight: '400' },
  wheelTextSelected: { color: AppColors.avocadoText, fontWeight: '600', fontSize: 22 },
  pickerActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16 },
  pickerCancelBtn: { ...AppStyles.button, flex: 1, backgroundColor: AppColors.limeTint },
  pickerCancelText: { ...AppStyles.buttonText },
  pickerConfirmBtn: { ...AppStyles.button, flex: 1 },
  pickerConfirmText: { ...AppStyles.buttonText },
});
