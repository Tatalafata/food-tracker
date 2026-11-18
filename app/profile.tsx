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
import { cleanProfileName, profileNameMaxLength, type ProfileDetails, useKitchen } from '@/store/kitchen';
import { profileCopy } from '@/store/profile-copy';
import { useTimers } from '@/store/timers';

export default function ProfileScreen() {
  const { language, t } = useI18n();
  const { area, firstName, lastName, setProfileDetails, loading, loadError } = useKitchen();
  const { timers, hidden } = useTimers();
  const copy = profileCopy[language];
  const [draft, setDraft] = useState<Partial<ProfileDetails>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<'saved' | 'error' | null>(null);
  const details = { area: draft.area ?? area, firstName: draft.firstName ?? firstName, lastName: draft.lastName ?? lastName };
  const unchanged = cleanRecipeArea(details.area) === area
    && cleanProfileName(details.firstName) === firstName && cleanProfileName(details.lastName) === lastName;
  const editable = !loading && !loadError && !saving;
  const disabled = !editable || unchanged;

  function edit(field: keyof ProfileDetails, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setResult(null);
  }

  async function save() {
    if (disabled) return;
    setSaving(true);
    try {
      await setProfileDetails(details);
      setDraft({});
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
            <Text accessibilityRole="header" style={styles.title}>{copy.details}</Text>
            <Text style={styles.copy}>{copy.detailsHint}</Text>
            <Text style={styles.label}>{copy.firstName}</Text>
            <TextInput accessibilityLabel={copy.firstName} style={AppStyles.input}
              value={details.firstName} onChangeText={value => edit('firstName', value)} autoComplete="given-name"
              autoCapitalize="words" maxLength={profileNameMaxLength} editable={editable} />
            <Text style={styles.label}>{copy.lastName}</Text>
            <TextInput accessibilityLabel={copy.lastName} style={AppStyles.input}
              value={details.lastName} onChangeText={value => edit('lastName', value)} autoComplete="family-name"
              autoCapitalize="words" maxLength={profileNameMaxLength} editable={editable} />
            <Text accessibilityRole="header" style={styles.title}>{copy.area}</Text>
            <Text style={styles.copy}>{copy.areaHint}</Text>
            <TextInput accessibilityLabel={copy.area} placeholder={copy.example} placeholderTextColor={AppColors.textLight}
              style={AppStyles.input} value={details.area} onChangeText={value => edit('area', value)}
              editable={editable} maxLength={areaMaxLength} returnKeyType="done" onSubmitEditing={save} />
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} style={[AppStyles.button, disabled && styles.disabled]}
              onPress={save} disabled={disabled}>
              <Text style={AppStyles.buttonText}>{t.save}</Text>
            </TouchableOpacity>
            {(result === 'error' || loadError) ? (
              <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>
            ) : result === 'saved' && <Text accessibilityLiveRegion="polite" style={styles.copy}>{copy.detailsSaved}</Text>}
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
  label: { color: AppColors.text, fontSize: 14, fontWeight: '600' },
  copy: { color: AppColors.textLight, fontSize: 14, lineHeight: 20 },
  error: { color: AppColors.expired },
  disabled: { opacity: 0.5 },
});
