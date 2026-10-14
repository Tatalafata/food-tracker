import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
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
        <ActivityIndicator color={AppColors.primaryDark} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
        <ScreenHeader title={t.scannerTitle} subtitle={t.scannerSubtitle} />
        <ScrollView contentContainerStyle={styles.permissionContent}>
          <View style={styles.permissionCard}>
            <View style={styles.cameraMark}><Ionicons name="scan-outline" size={34} color={AppColors.primaryDark} /></View>
            <Text style={styles.permTitle}>{t.scannerCameraTitle}</Text>
            <Text style={styles.permText}>{t.scannerCameraText}</Text>
            <TouchableOpacity style={styles.btn} accessibilityRole="button" onPress={permission.canAskAgain || Platform.OS === 'web' ? requestPermission : () => Linking.openSettings()}>
              <Text style={styles.btnText}>{permission.canAskAgain || Platform.OS === 'web' ? t.scannerGrantAccess : t.scannerSettings}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualBtn} onPress={() => router.push('/add-product')} accessibilityRole="button">
              <Ionicons name="add" size={20} color={AppColors.primaryDark} />
              <Text style={styles.cancelText}>{t.addProductTitle}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.scannerTitle} subtitle={t.scannerSubtitle} action={
        <TouchableOpacity style={AppStyles.iconButton} onPress={() => router.push('/add-product')} accessibilityRole="button" accessibilityLabel={t.addProductTitle}>
          <Ionicons name="add" size={25} color={AppColors.primaryDark} />
        </TouchableOpacity>
      } />

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
  center: { ...AppStyles.screen, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 0 },
  permissionCard: { ...AppStyles.card, padding: 24, alignItems: 'center' },
  cameraMark: { width: 80, height: 80, borderRadius: 28, backgroundColor: AppColors.surfaceTint, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  cameraContainer: { flex: 1, position: 'relative', marginHorizontal: 24, marginBottom: 24, borderRadius: 26, overflow: 'hidden', minHeight: 200 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: '80%', maxWidth: 280, height: 160, borderRadius: 20, borderWidth: 2, borderColor: AppColors.accent, backgroundColor: 'transparent' },
  scanHint: { position: 'absolute', bottom: 28, left: 16, right: 16, textAlign: 'center', color: AppColors.white, fontSize: 14, lineHeight: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, overflow: 'hidden' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: AppColors.white, fontSize: 16, fontWeight: '500' },
  form: { padding: 24, gap: 4, paddingBottom: 32 },
  formTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text, marginBottom: 4 },
  formBarcode: { fontSize: 12, color: AppColors.textLight, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: AppColors.text, marginTop: 20, marginBottom: 8 },
  input: { ...AppStyles.input },
  inputHint: { fontSize: 13, lineHeight: 20, color: AppColors.textLight, marginTop: 6 },
  btn: { ...AppStyles.button, alignSelf: 'stretch', marginTop: 24 },
  btnText: { ...AppStyles.buttonText, textAlign: 'center' },
  manualBtn: { minHeight: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, alignSelf: 'stretch' },
  cancelBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  cancelText: { color: AppColors.primaryDark, fontSize: 15, fontWeight: '500' },
  permTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.4, color: AppColors.text, textAlign: 'center', marginBottom: 12 },
  permText: { fontSize: 14, lineHeight: 22, color: AppColors.textLight, textAlign: 'center' },
  successIcon: { fontSize: 44, color: AppColors.good, fontWeight: '500', backgroundColor: AppColors.goodBg, width: 96, height: 96, borderRadius: 32, textAlign: 'center', lineHeight: 96, marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text, marginBottom: 24, textAlign: 'center' },
});
