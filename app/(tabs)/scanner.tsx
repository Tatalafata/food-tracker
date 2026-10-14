import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { usePantry } from '@/store/pantry';

function lastDayOfMonth(year: number, month: number): string {
  return String(new Date(year, month, 0).getDate()).padStart(2, '0');
}

function parseExpiryDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${lastDayOfMonth(y, m)}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{2}\/\d{4}$/.test(s)) {
    const [mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${lastDayOfMonth(parseInt(yyyy, 10), parseInt(mm, 10))}`;
  }
  if (/^\d{2}-\d{4}$/.test(s)) {
    const [mm, yyyy] = s.split('-');
    return `${yyyy}-${mm}-${lastDayOfMonth(parseInt(yyyy, 10), parseInt(mm, 10))}`;
  }
  return '';
}

type Phase =
  | { kind: 'scanning' }
  | { kind: 'loading' }
  | { kind: 'form'; name: string; barcode: string }
  | { kind: 'success'; name: string };

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [productName, setProductName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const scanned = useRef(false);
  const { addItem } = usePantry();
  const { t } = useI18n();

  async function handleBarcode({ data }: { data: string }) {
    if (scanned.current) return;
    scanned.current = true;
    setPhase({ kind: 'loading' });
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json?fields=product_name,brands,expiration_date`,
      );
      const json = await res.json();
      const name: string = json?.product?.product_name || json?.product?.brands || '';
      const rawExpiry: string = json?.product?.expiration_date ?? '';
      setProductName(name.trim());
      setExpiryDate(parseExpiryDate(rawExpiry));
      setPhase({ kind: 'form', name: name.trim(), barcode: data });
    } catch {
      setProductName('');
      setExpiryDate('');
      setPhase({ kind: 'form', name: '', barcode: data });
    }
  }

  async function handleAdd() {
    if (!productName.trim()) {
      Alert.alert(t.scannerMissingName, t.scannerMissingNameMsg);
      return;
    }
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert(t.scannerInvalidDate, t.scannerInvalidDateMsg);
      return;
    }
    const barcode = phase.kind === 'form' ? phase.barcode : undefined;
    await addItem({ name: productName.trim(), expiryDate: expiryDate || undefined, barcode });
    setPhase({ kind: 'success', name: productName.trim() });
  }

  function reset() {
    scanned.current = false;
    setProductName('');
    setExpiryDate('');
    setPhase({ kind: 'scanning' });
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permTitle}>{t.scannerCameraTitle}</Text>
        <Text style={styles.permText}>{t.scannerCameraText}</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>{t.scannerGrantAccess}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (phase.kind === 'success') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>{t.scannerSuccess(phase.name)}</Text>
        <TouchableOpacity style={styles.btn} onPress={reset}>
          <Text style={styles.btnText}>{t.scannerScanAgain}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.scannerTitle}</Text>
          <Text style={styles.subtitle}>{t.scannerSubtitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.addManualBtn}
          onPress={() => router.push('/add-product' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.addManualText}>+</Text>
        </TouchableOpacity>
      </View>

      {(phase.kind === 'scanning' || phase.kind === 'loading') && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={phase.kind === 'scanning' ? handleBarcode : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
          </View>
          {phase.kind === 'loading' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={AppColors.white} />
              <Text style={styles.loadingText}>{t.scannerLookingUp}</Text>
            </View>
          )}
          <Text style={styles.scanHint}>{t.scannerAlignHint}</Text>
        </View>
      )}

      {phase.kind === 'form' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.formTitle}>{t.scannerConfirmTitle}</Text>
            {phase.barcode ? <Text style={styles.formBarcode}>{t.scannerBarcodeLabel} {phase.barcode}</Text> : null}

            <Text style={styles.label}>{t.scannerNameLabel}</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder={t.scannerNamePlaceholder}
              placeholderTextColor={AppColors.textLight}
              returnKeyType="next"
            />

            <Text style={styles.label}>{t.scannerExpiryLabel}</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={AppColors.textLight}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Text style={styles.inputHint}>
              {expiryDate ? t.scannerAutoFilled : t.scannerNotFound}
            </Text>

            <TouchableOpacity style={styles.btn} onPress={handleAdd}>
              <Text style={styles.btnText}>{t.scannerAddBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelText}>{t.scannerScanAgain}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background, padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: AppColors.primary,
  },
  title: { fontSize: 24, fontWeight: '700', color: AppColors.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addManualBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  addManualText: { fontSize: 24, color: AppColors.white, lineHeight: 28 },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 240, height: 160, borderRadius: 12, borderWidth: 2, borderColor: AppColors.accent, backgroundColor: 'transparent' },
  scanHint: {
    position: 'absolute', bottom: 32, alignSelf: 'center', color: AppColors.white, fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: 'hidden',
  },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: AppColors.white, fontSize: 16, fontWeight: '600' },
  form: { padding: 24, gap: 4 },
  formTitle: { fontSize: 22, fontWeight: '700', color: AppColors.text, marginBottom: 4 },
  formBarcode: { fontSize: 12, color: AppColors.textLight, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.textLight, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: AppColors.border, borderRadius: 10, padding: 14, fontSize: 16, color: AppColors.text, backgroundColor: AppColors.white },
  inputHint: { fontSize: 12, color: AppColors.textLight, marginTop: 5 },
  btn: { backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  cancelText: { color: AppColors.textLight, fontSize: 15 },
  permTitle: { fontSize: 20, fontWeight: '700', color: AppColors.text, marginBottom: 8 },
  permText: { fontSize: 14, color: AppColors.textLight, textAlign: 'center', marginBottom: 24 },
  successIcon: {
    fontSize: 64, color: AppColors.good, fontWeight: '700', backgroundColor: AppColors.goodBg,
    width: 100, height: 100, borderRadius: 50, textAlign: 'center', lineHeight: 100, marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: AppColors.text, marginBottom: 24 },
});
