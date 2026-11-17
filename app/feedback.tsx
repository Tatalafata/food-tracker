import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { feedbackEndpoint, feedbackLimit, sendFeedback, type FeedbackResult } from '@/lib/feedback';
import { feedbackCopy } from '@/store/feedback-copy';
import { useI18n } from '@/store/i18n';
import { useTimers } from '@/store/timers';

const endpoint = feedbackEndpoint(process.env.EXPO_PUBLIC_FEEDBACK_URL);

export default function FeedbackScreen() {
  const { language } = useI18n();
  const { timers, hidden } = useTimers();
  const copy = feedbackCopy[language];
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<FeedbackResult | null>(null);
  const pending = useRef(false);
  const disabled = !endpoint || !message.trim() || sending;

  async function submit() {
    if (!endpoint || disabled || pending.current) return;
    pending.current = true;
    setSending(true);
    setOutcome(null);
    try {
      const result = await sendFeedback(endpoint, message);
      setOutcome(result);
      if (result === 'sent') setMessage('');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={AppStyles.screen}>
      <ScreenHeader title={copy.title} icon="chatbubble-ellipses-outline"
        action={<TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.back} style={AppStyles.iconButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')}>
          <Ionicons name="chevron-back" size={22} color={AppColors.avocadoText} />
        </TouchableOpacity>} />
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, !hidden && timers.length > 0 && styles.timerSpace]}>
          <Text style={styles.copy}>{copy.intro}</Text>
          <Text style={styles.label}>{copy.message}</Text>
          <TextInput style={[AppStyles.input, styles.field]} value={message} accessibilityLabel={copy.message}
            onChangeText={text => { setMessage(text); setOutcome(null); }} editable={!sending}
            placeholder={copy.example} placeholderTextColor={AppColors.textLight}
            multiline textAlignVertical="top" maxLength={feedbackLimit} />
          <Text style={styles.count}>{message.length} / {feedbackLimit}</Text>
          {endpoint ? <Text style={styles.copy}>{copy.privacy}</Text>
            : <Text style={[styles.copy, styles.notice]}>{copy.unavailable}</Text>}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled, busy: sending }}
            disabled={disabled} onPress={submit} style={[AppStyles.button, disabled && styles.disabled]}>
            <Text style={AppStyles.buttonText}>{sending ? copy.sending : copy.send}</Text>
          </TouchableOpacity>
          {outcome && (
            <Text accessibilityLiveRegion="polite" accessibilityRole={outcome === 'sent' ? undefined : 'alert'}
              style={[styles.notice, outcome === 'sent' ? styles.success : styles.error]}>
              {copy[outcome]}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 32, gap: 10 },
  timerSpace: { paddingBottom: 148 },
  copy: { fontSize: 14, lineHeight: 21, color: AppColors.textLight },
  label: { color: AppColors.text, fontWeight: '600', marginTop: 6 },
  field: { minHeight: 154 },
  count: { alignSelf: 'flex-end', color: AppColors.textLight, fontSize: 12 },
  notice: { backgroundColor: AppColors.warmTint, padding: 12, borderRadius: 12, lineHeight: 21 },
  success: { color: AppColors.primaryDark, backgroundColor: AppColors.goodBg },
  error: { color: AppColors.expired, backgroundColor: AppColors.expiredBg },
  disabled: { opacity: 0.55 },
});
