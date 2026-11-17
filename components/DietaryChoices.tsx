import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppStyles } from '@/constants/theme';
import { STANDARD_DIET_IDS, useDietaryPreferences } from '@/store/dietary-preferences';
import { useI18n } from '@/store/i18n';

interface DietaryChoicesProps {
  title: string;
  hint: string;
  selected: ReadonlySet<string>;
  disabled?: boolean;
  onToggle: (id: string) => void;
  onAdd?: (id: string) => void;
}

export default function DietaryChoices({ title, hint, selected, disabled, onToggle, onAdd }: DietaryChoicesProps) {
  const { t } = useI18n();
  const { custom, ready, loadError } = useDietaryPreferences();
  const [adding, setAdding] = useState(false);
  const unavailable = disabled || !ready;

  function choice(id: string, name: string, description?: string) {
    const checked = selected.has(id);
    return (
      <TouchableOpacity
        key={id}
        accessibilityRole="checkbox"
        accessibilityLabel={name}
        accessibilityHint={description}
        accessibilityState={{ checked, disabled: unavailable }}
        aria-checked={checked}
        disabled={unavailable}
        style={[styles.chip, description && styles.customChip, checked && styles.checkedChip]}
        onPress={() => onToggle(id)}>
        <Text style={[styles.chipText, checked && styles.checkedText]}>{name}</Text>
        {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {onAdd && (
          <TouchableOpacity
            style={AppStyles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t.dietary.add}
            disabled={unavailable}
            onPress={() => setAdding(true)}>
            <Ionicons name="add" size={23} color={AppColors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>{hint}</Text>
      {loadError ? (
        <Text accessibilityRole="alert" style={styles.error}>{t.dietary.loadError}</Text>
      ) : (
        <View style={styles.grid}>
          {STANDARD_DIET_IDS.map(id => choice(id, t.dietLabels[id]))}
          {custom.map(diet => choice(diet.id, diet.name, diet.description))}
        </View>
      )}
      {onAdd && adding && (
        <DietaryPreferenceForm
          onClose={() => setAdding(false)}
          onSaved={(id) => { onAdd(id); setAdding(false); }}
        />
      )}
    </View>
  );
}

function DietaryPreferenceForm({ onSaved, onClose }: { onSaved: (id: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const { addCustom } = useDietaryPreferences();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const canSave = !!name.trim() && !!description.trim() && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(false);
    try {
      onSaved(await addCustom(name, description));
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={() => !saving && onClose()}>
      <SafeAreaView style={AppStyles.screen}>
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>{t.dietary.add}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
                style={AppStyles.iconButton}
                disabled={saving}
                onPress={onClose}>
                <Ionicons name="close" size={22} color={AppColors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>{t.dietary.name}</Text>
            <TextInput
              accessibilityLabel={t.dietary.name}
              style={AppStyles.input}
              value={name}
              onChangeText={setName}
              editable={!saving}
              maxLength={64}
            />
            <Text style={styles.label}>{t.dietary.description}</Text>
            <TextInput
              accessibilityLabel={t.dietary.description}
              style={[AppStyles.input, styles.multiline]}
              multiline
              value={description}
              onChangeText={setDescription}
              editable={!saving}
              maxLength={280}
            />
            {saveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
            <TouchableOpacity
              accessibilityRole="button"
              disabled={!canSave}
              style={[AppStyles.button, styles.save, !canSave && styles.disabled]}
              onPress={save}>
              {saving ? <ActivityIndicator color={AppColors.onPrimary} /> : <Text style={AppStyles.buttonText}>{t.save}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: AppColors.text },
  hint: { fontSize: 13, lineHeight: 19, color: AppColors.textLight, marginVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { ...AppStyles.card, minHeight: 48, maxWidth: '100%', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  customChip: { width: '100%' },
  checkedChip: { backgroundColor: AppColors.avocado, borderColor: AppColors.limeBorder },
  chipText: { fontSize: 14, color: AppColors.textLight },
  checkedText: { color: AppColors.avocadoText, fontWeight: '600' },
  description: { fontSize: 13, color: AppColors.textLight, lineHeight: 18, marginTop: 4 },
  keyboard: { flex: 1 },
  form: { padding: 24, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', color: AppColors.text, marginTop: 20, marginBottom: 8 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  save: { marginTop: 22 },
  disabled: { opacity: 0.55 },
  error: { color: AppColors.expired, marginTop: 10 },
});
