import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { lookupProductBarcode, normalizeProductBarcode } from '@/lib/product-barcode';
import { useI18n } from '@/store/i18n';
import { usePantry } from '@/store/pantry';
import { scannerCopy } from '@/store/scanner-copy';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const [manual, setManual] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [code, setCode] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const request = useRef<AbortController | null>(null);
  const { items } = usePantry();
  const { language, t } = useI18n();
  const copy = scannerCopy[language];
  const manualBarcode = normalizeProductBarcode(code);

  useFocusEffect(useCallback(() => () => {
    request.current?.abort();
    request.current = null;
    setLookingUp(false);
  }, []));

  async function openProduct(barcode: string) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLookingUp(true);
    const known = items.find(item => item.barcode && normalizeProductBarcode(item.barcode) === barcode);
    const timeout = setTimeout(() => controller.abort(), 7000);
    const product = await (known
      ? Promise.resolve({ name: known.name, lookup: 'found' })
      : lookupProductBarcode(barcode, language, controller.signal, Platform.OS !== 'web').catch(() => ({ name: '', lookup: 'unavailable' })));
    clearTimeout(timeout);
    if (request.current !== controller) return;
    setCode('');
    router.push({ pathname: '/add-product', params: { barcode, ...product } });
  }

  function handleBarcode({ data, type }: BarcodeScanningResult) {
    const barcode = normalizeProductBarcode(data, type);
    if (barcode) void openProduct(barcode);
  }

  const showCamera = focused && permission?.granted && !manual && !cameraError && !lookingUp;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={AppStyles.screen}>
      <ScreenHeader title={t.scannerTitle} subtitle={t.scannerSubtitle} action={
        <TouchableOpacity style={AppStyles.iconButton} onPress={() => router.push('/add-product')}
          disabled={lookingUp} accessibilityRole="button" accessibilityLabel={t.addProductTitle}>
          <Ionicons name="add" size={25} color={AppColors.primaryDark} />
        </TouchableOpacity>
      } />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {lookingUp ? (
            <View style={styles.card} accessibilityLiveRegion="polite">
              <ActivityIndicator color={AppColors.primaryDark} />
              <Text style={styles.hint}>{t.scannerLookingUp}</Text>
            </View>
          ) : (
            <>
              {showCamera && (
                <View style={styles.cameraContainer}>
                  <CameraView style={styles.screen} facing="back" onBarcodeScanned={handleBarcode}
                    barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'code128', 'code39'] }}
                    onMountError={() => setCameraError(true)} />
                  <View style={styles.overlay} pointerEvents="none"><View style={styles.scanFrame} /></View>
                  <Text style={styles.scanHint}>{t.scannerAlignHint}</Text>
                </View>
              )}
              {!permission && !manual && <ActivityIndicator color={AppColors.primaryDark} />}
              {permission && !permission.granted && !manual && !cameraError && (
                <View style={styles.card}>
                  <Text style={styles.title}>{t.scannerCameraTitle}</Text>
                  <Text style={styles.hint}>{t.scannerCameraText}</Text>
                  <TouchableOpacity style={AppStyles.button} accessibilityRole="button"
                    onPress={permission.canAskAgain || Platform.OS === 'web' ? requestPermission : () => Linking.openSettings()}>
                    <Text style={AppStyles.buttonText}>{permission.canAskAgain || Platform.OS === 'web' ? t.scannerGrantAccess : t.scannerSettings}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {cameraError && <Text style={styles.hint} accessibilityRole="alert">{copy.cameraError}</Text>}
              {manual || cameraError ? (
                <View style={styles.card}>
                  <Text style={styles.title}>{copy.enterCode}</Text>
                  <TextInput accessibilityLabel={copy.enterCode} style={AppStyles.input} value={code}
                    onChangeText={setCode} keyboardType="number-pad" maxLength={24} autoCorrect={false}
                    onSubmitEditing={() => { if (manualBarcode) void openProduct(manualBarcode); }} />
                  <TouchableOpacity style={[AppStyles.button, !manualBarcode && styles.disabled]} accessibilityRole="button"
                    disabled={!manualBarcode} onPress={() => { if (manualBarcode) void openProduct(manualBarcode); }}>
                    <Text style={AppStyles.buttonText}>{copy.lookUp}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondary} accessibilityRole="button"
                    onPress={() => { setManual(false); setCameraError(false); }}>
                    <Text style={AppStyles.buttonText}>{t.scannerScanAgain}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.secondary} accessibilityRole="button" onPress={() => setManual(true)}>
                  <Text style={AppStyles.buttonText}>{copy.enterCode}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
  card: { ...AppStyles.card, padding: 16, gap: 12 },
  title: { fontSize: 19, fontWeight: '600', color: AppColors.text },
  hint: { color: AppColors.textLight, fontSize: 14, lineHeight: 21 },
  disabled: { opacity: 0.5 },
  secondary: { ...AppStyles.button, backgroundColor: AppColors.limeTint, minHeight: 48, paddingVertical: 12 },
  cameraContainer: { flex: 1, minHeight: 220, borderRadius: 26, overflow: 'hidden', backgroundColor: AppColors.text },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: '80%', maxWidth: 280, height: 130, borderRadius: 20, borderWidth: 2, borderColor: AppColors.avocado },
  scanHint: { position: 'absolute', bottom: 12, left: 12, right: 12, textAlign: 'center', color: AppColors.white,
    fontSize: 14, lineHeight: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 12, overflow: 'hidden' },
});
