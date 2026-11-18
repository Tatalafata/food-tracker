import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppColors, AppStyles } from '@/constants/theme';
import { MAX_RECIPE_NOTE_LENGTH, type RecipeNoteTarget } from '@/lib/recipe-notes';
import { useI18n } from '@/store/i18n';
import { recipeNoteIdentity, useRecipeNotes } from '@/store/recipe-notes';
import { recipeNotesCopy } from '@/store/recipe-notes-copy';

export default function RecipeNotes({ target }: { target: RecipeNoteTarget }) {
  const { language, t } = useI18n();
  const copy = recipeNotesCopy[language];
  const { notes, ready, loadError, saveNote } = useRecipeNotes();
  const existing = notes[recipeNoteIdentity(target)]?.text;
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const editing = draft !== null;

  function toggleEditor() {
    setSaveError(false);
    setDraft(editing ? null : existing ?? '');
  }

  async function save() {
    if (draft === null || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await saveNote(target, draft.trim());
      setDraft(null);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity style={[AppStyles.card, styles.toggle]} accessibilityRole="button"
        accessibilityLabel={copy.title}
        accessibilityState={{ expanded: editing, disabled: !ready || saving }} disabled={!ready || saving} onPress={toggleEditor}>
        <Ionicons name={existing ? 'document-text' : 'document-text-outline'} size={20} color={AppColors.primaryDark} />
        <Text style={styles.title}>{copy.title}</Text>
        <Ionicons name={editing ? 'chevron-up' : 'chevron-down'} size={20} color={AppColors.primaryDark} />
      </TouchableOpacity>
      {loadError && <Text accessibilityRole="alert" style={styles.error}>{copy.readError}</Text>}
      {editing && (
        <View style={styles.editor}>
          <TextInput style={[AppStyles.input, styles.input]} accessibilityLabel={copy.title} placeholder={copy.placeholder}
            placeholderTextColor={AppColors.textLight} textAlignVertical="top" multiline maxLength={MAX_RECIPE_NOTE_LENGTH}
            editable={!saving} value={draft} onChangeText={setDraft} />
          {saveError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity style={[AppStyles.button, styles.cancel]} accessibilityRole="button" disabled={saving} onPress={toggleEditor}>
              <Text style={AppStyles.buttonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={AppStyles.button} accessibilityRole="button" disabled={saving} onPress={save}>
              <Text style={AppStyles.buttonText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: 14, gap: 8 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: AppColors.text },
  editor: { gap: 8 },
  input: { minHeight: 108 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  cancel: { backgroundColor: AppColors.surfaceTint },
  error: { color: AppColors.expired },
});
