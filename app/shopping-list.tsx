import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '@/components/ScreenHeader';
import { AppColors, AppStyles } from '@/constants/theme';
import { ingredientKey } from '@/lib/shopping';
import { useI18n } from '@/store/i18n';
import { useKitchen } from '@/store/kitchen';
import { kitchenCopy } from '@/store/kitchen-copy';
import { useTimers } from '@/store/timers';

export default function ShoppingListScreen() {
  const { language, t } = useI18n();
  const copy = kitchenCopy[language];
  const { shopping, loading, loadError, addToShopping, toggleBought, removeShoppingItem } = useKitchen();
  const { timers, hidden } = useTimers();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'duplicate' | 'error' | null>(null);
  const disabled = loading || loadError || saving || !ingredientKey(name);
  const pending = shopping.filter(item => !item.bought);
  const bought = shopping.filter(item => item.bought);
  const sections = [
    { key: 'pending', title: copy.pending, data: pending },
    { key: 'bought', title: copy.bought, data: bought },
  ].filter(section => section.data.length > 0);

  async function add() {
    if (disabled) return;
    setSaving(true);
    setFeedback(null);
    try {
      if (await addToShopping([{ name, quantity }])) {
        setName('');
        setQuantity('');
      } else {
        setFeedback('duplicate');
      }
    } catch {
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  }

  function change(action: () => Promise<void>) {
    setFeedback(null);
    void action().catch(() => setFeedback('error'));
  }

  return (
    <SafeAreaView style={AppStyles.screen}>
      <ScreenHeader title={copy.shopping} subtitle={loading || loadError ? undefined : copy.toBuy(pending.length)}
        action={<TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.back} style={AppStyles.iconButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Ionicons name="chevron-back" size={23} color={AppColors.avocadoText} />
        </TouchableOpacity>} />
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, !hidden && timers.length > 0 && styles.timerSpace]}
          ListHeaderComponent={
            <View style={styles.form}>
              {loading ? <ActivityIndicator color={AppColors.primaryDark} /> : loadError ? (
                <Text accessibilityRole="alert" style={styles.error}>{copy.loadError}</Text>
              ) : (
                <>
                  <TextInput accessibilityLabel={copy.item} placeholder={copy.item} placeholderTextColor={AppColors.textLight}
                    style={AppStyles.input} value={name} onChangeText={value => { setName(value); setFeedback(null); }}
                    maxLength={100} editable={!saving} returnKeyType="done" onSubmitEditing={add} />
                  <View style={styles.formRow}>
                    <TextInput accessibilityLabel={copy.quantity} placeholder={copy.quantity} placeholderTextColor={AppColors.textLight}
                      style={[AppStyles.input, styles.quantity]} value={quantity} onChangeText={setQuantity}
                      maxLength={60} editable={!saving} returnKeyType="done" onSubmitEditing={add} />
                    <TouchableOpacity style={[AppStyles.button, styles.add, disabled && styles.disabled]}
                      accessibilityRole="button" accessibilityLabel={copy.add} disabled={disabled} onPress={add}>
                      <Ionicons name="add" size={22} color={AppColors.avocadoText} />
                    </TouchableOpacity>
                  </View>
                  {feedback && (
                    <Text accessibilityRole="alert" style={feedback === 'error' ? styles.error : styles.hint}>
                      {feedback === 'duplicate' ? copy.duplicate : t.saveError}
                    </Text>
                  )}
                </>
              )}
            </View>
          }
          ListEmptyComponent={!loading && !loadError ? (
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={28} color={AppColors.primaryDark} />
              <Text style={styles.hint}>{copy.empty}</Text>
            </View>
          ) : null}
          renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={styles.section}>{section.title}</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity accessibilityRole="checkbox" accessibilityLabel={item.name} accessibilityHint={item.quantity || undefined}
                accessibilityState={{ checked: item.bought }} aria-checked={item.bought}
                onPress={() => change(() => toggleBought(item.id))} style={styles.check}>
                <Ionicons name={item.bought ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={AppColors.primaryDark} />
                <View style={styles.itemCopy}>
                  <Text style={[styles.name, item.bought && styles.strike]}>{item.name}</Text>
                  {!!item.quantity && <Text style={styles.hint}>{item.quantity}</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.remove + ' ' + item.name}
                style={styles.remove} onPress={() => change(() => removeShoppingItem(item.id))}>
                <Ionicons name="trash-outline" size={20} color={AppColors.textLight} />
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  timerSpace: { paddingBottom: 148 },
  form: { gap: 8, marginBottom: 14 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quantity: { flex: 1, minWidth: 0, paddingHorizontal: 12, fontSize: 14 },
  add: { width: 56, paddingHorizontal: 0 },
  disabled: { opacity: 0.5 },
  empty: { ...AppStyles.card, gap: 10, alignItems: 'center', padding: 24, marginTop: 6 },
  hint: { fontSize: 14, lineHeight: 20, color: AppColors.textLight },
  error: { fontSize: 14, color: AppColors.expired },
  section: { fontSize: 17, fontWeight: '700', color: AppColors.text, marginTop: 14, marginBottom: 8 },
  row: { ...AppStyles.card, alignItems: 'center', flexDirection: 'row', borderRadius: 14, marginBottom: 8 },
  check: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 10, paddingVertical: 6 },
  itemCopy: { flex: 1, gap: 2 },
  name: { fontSize: 16, color: AppColors.text, fontWeight: '500' },
  strike: { color: AppColors.textLight, textDecorationLine: 'line-through' },
  remove: { ...AppStyles.iconButton, backgroundColor: 'transparent' },
});
