import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { inspirationPhotoCredits } from '@/lib/inspiration-search';
import { useI18n } from '@/store/i18n';
import { inspirationCopy } from '@/store/inspiration-copy';

export default function InspirationPhotoCredits() {
  const { language, t } = useI18n();
  const copy = inspirationCopy[language];
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);

  function open(url: string) {
    setError(false);
    void Linking.openURL(url).catch(() => setError(true));
  }

  return (
    <>
      <TouchableOpacity accessibilityRole="button" style={styles.trigger}
        onPress={() => { setError(false); setVisible(true); }}>
        <Text style={styles.triggerText}>{copy.credits}</Text>
      </TouchableOpacity>
      {visible && (
        <Modal visible animationType="slide" onRequestClose={() => setVisible(false)}>
          <SafeAreaView style={AppStyles.screen} accessibilityViewIsModal>
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">{copy.credits}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.cancel} style={AppStyles.iconButton}
                onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={AppColors.avocadoText} />
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.error} accessibilityRole="alert">{copy.photoError}</Text>}
            <FlatList data={inspirationPhotoCredits} keyExtractor={photo => photo.source}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <TouchableOpacity accessibilityRole="link" style={styles.link} onPress={() => open(item.source)}>
                    <Text style={styles.photoLabel}>{item.title}</Text>
                    {!!item.author && <Text style={styles.author}>{item.author}</Text>}
                  </TouchableOpacity>
                  {item.licenseUrl ? (
                    <TouchableOpacity accessibilityRole="link" style={styles.license} onPress={() => open(item.licenseUrl!)}>
                      <Text style={styles.triggerText}>{item.license}</Text>
                    </TouchableOpacity>
                  ) : <Text style={styles.author}>{item.license}</Text>}
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center' },
  triggerText: { fontSize: 14, color: AppColors.primaryDark, textDecorationLine: 'underline' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: AppColors.text },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: AppColors.border, gap: 12 },
  link: { flex: 1, minHeight: 48, justifyContent: 'center', paddingVertical: 8 },
  photoLabel: { color: AppColors.text, fontSize: 15, fontWeight: '600' },
  author: { color: AppColors.textLight, fontSize: 13, marginTop: 3 },
  license: { minHeight: 48, justifyContent: 'center' },
  error: { color: AppColors.expired, marginHorizontal: 20, marginBottom: 12 },
});
