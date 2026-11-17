import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileBackupSection from '@/components/ProfileBackup';
import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { areaMaxLength, cleanRecipeArea } from '@/lib/recipe-area';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { profileCopy } from '@/store/profile-copy';
import { useTimers } from '@/store/timers';

export default function ProfileScreen() {
  const { language, t } = useI18n();
  const { area, setArea, loading, loadError } = useKitchen();
  const { timers, hidden } = useTimers();
  const copy = profileCopy[language];
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<'saved' | 'error' | null>(null);
  const value = draft ?? area;
  const disabled = loading || loadError || saving || cleanRecipeArea(value) === area;

  async function save() {
    if (disabled) return;
    setSaving(true);
    try {
      await setArea(value);
      setDraft(null);
      setResult('saved');
    } catch {
      setResult('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={AppStyles.screen}>
      <ScreenHeader title={copy.title} action={
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.back} style={AppStyles.iconButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')}>
          <Ionicons name="chevron-back" size={22} color={AppColors.avocadoText} />
        </TouchableOpacity>
      } />
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, !hidden && timers.length > 0 && styles.timerSpace]}>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>{copy.area}</Text>
            <Text style={styles.copy}>{copy.areaHint}</Text>
            <TextInput accessibilityLabel={copy.area} placeholder={copy.example} placeholderTextColor={AppColors.textLight}
              style={AppStyles.input} value={value} onChangeText={text => { setDraft(text); setResult(null); }}
              editable={!loading && !loadError && !saving} maxLength={areaMaxLength} returnKeyType="done" onSubmitEditing={save} />
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} style={[AppStyles.button, disabled && styles.disabled]}
              onPress={save} disabled={disabled}>
              <Text style={AppStyles.buttonText}>{t.save}</Text>
            </TouchableOpacity>
            {(result === 'error' || loadError) ? (
              <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>
            ) : result === 'saved' && <Text accessibilityLiveRegion="polite" style={styles.copy}>{copy.areaSaved}</Text>}
          </View>
          <ProfileBackupSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 30, gap: 14 },
  timerSpace: { paddingBottom: 148 },
  card: { ...AppStyles.card, padding: 14, gap: 10 },
  title: { color: AppColors.text, fontSize: 18, fontWeight: '700' },
  copy: { color: AppColors.textLight, fontSize: 14, lineHeight: 20 },
  error: { color: AppColors.expired },
  disabled: { opacity: 0.5 },
});
