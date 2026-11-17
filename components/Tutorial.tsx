import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { useI18n } from '@/store/i18n';
import { tutorialCopy } from '@/store/tutorial-copy';

const icons = ['leaf-outline', 'basket-outline', 'restaurant-outline', 'calendar-outline'] as const;

interface Props {
  skipped: boolean;
  onSkip: () => void;
  onDone: () => void;
}

export function Tutorial({ skipped, onSkip, onDone }: Props) {
  const { language } = useI18n();
  const copy = tutorialCopy[language];
  const [step, setStep] = useState(0);
  const [title, detail] = copy.pages[step];
  const last = step === copy.pages.length - 1;

  return (
    <SafeAreaView style={AppStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.label}>{copy.label}</Text>
        {!skipped && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.close} style={AppStyles.iconButton} onPress={onSkip}>
            <Ionicons name="close" size={24} color={AppColors.avocadoText} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content} key={skipped ? 'skipped' : step}>
        <View style={[styles.illustration, step % 2 === 1 && styles.warm]}>
          <Ionicons name={skipped ? 'settings-outline' : icons[step]} size={56} color={AppColors.avocadoText} />
        </View>
        {skipped ? (
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.notice}>{copy.skipped}</Text>
        ) : (
          <>
            <Text style={styles.counter} accessibilityLiveRegion="polite">{copy.step(step + 1, copy.pages.length)}</Text>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            <Text style={styles.detail}>{detail}</Text>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {!skipped && step > 0 && (
          <TouchableOpacity accessibilityRole="button" style={styles.previous} onPress={() => setStep(current => Math.max(0, current - 1))}>
            <Text style={AppStyles.buttonText}>{copy.previous}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessibilityRole="button" style={[AppStyles.button, styles.next]}
          onPress={skipped || last ? onDone : () => setStep(current => Math.min(copy.pages.length - 1, current + 1))}>
          <Text style={AppStyles.buttonText}>{skipped ? copy.continue : last ? copy.done : step === 0 ? copy.start : copy.next}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function TutorialReplay({ onClose }: { onClose: () => void }) {
  const [skipped, setSkipped] = useState(false);
  const skip = () => setSkipped(true);
  return (
    <Modal animationType="slide" onRequestClose={skipped ? onClose : skip}>
      <Tutorial skipped={skipped} onSkip={skip} onDone={onClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, minHeight: 65 },
  label: { fontSize: 17, fontWeight: '600', color: AppColors.primaryDark },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 26, justifyContent: 'center', alignItems: 'center', gap: 12 },
  illustration: { width: 128, aspectRatio: 1, borderRadius: 37, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  warm: { backgroundColor: AppColors.warmTint },
  counter: { color: AppColors.primaryDark, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  title: { color: AppColors.text, fontSize: 27, lineHeight: 33, fontWeight: '700', textAlign: 'center' },
  detail: { color: AppColors.textLight, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  notice: { color: AppColors.text, fontSize: 21, lineHeight: 29, fontWeight: '600', textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'stretch', gap: 10, padding: 18 },
  previous: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 12 },
  next: { flex: 1, paddingHorizontal: 12 },
});
