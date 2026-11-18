import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimerDock } from '@/components/CookingTimers';
import RecipeNotes from '@/components/RecipeNotes';
import { AppColors, AppStyles } from '@/constants/theme';
import inspirationText from '@/lib/data/inspiration-text.json';
import { inspirationIndex, type OnlineInspiration } from '@/lib/inspiration-search';
import { readWikiRecipe, wikiRecipeKey, type WikiRecipe } from '@/lib/wiki-recipe';
import { useI18n } from '@/store/i18n';
import { inspirationCopy } from '@/store/inspiration-copy';
import { useTimers } from '@/store/timers';

const articles: Record<string, WikiRecipe> = inspirationText as Record<string, WikiRecipe>;

export default function OnlineRecipeDetail({ entry, onClose }: { entry: OnlineInspiration; onClose: () => void }) {
  const { language, t } = useI18n();
  const { hidden, timers, setDockInDetail } = useTimers();
  const copy = inspirationCopy[language];
  const [trail, setTrail] = useState([entry]);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ url: string; article: WikiRecipe | null } | null>(null);
  const current = trail[trail.length - 1];
  const included = articles[wikiRecipeKey(current.url) ?? ''];
  const resolved = result?.url === current.url ? result : null;
  const article = included ?? resolved?.article;
  const related = useMemo(() => new Map(inspirationIndex(language).flatMap(recipe => {
    const key = recipe.url && wikiRecipeKey(recipe.url);
    return key && recipe.url ? [[key, recipe] as const] : [];
  })), [language]);

  useEffect(() => {
    setDockInDetail(true);
    return () => setDockInDetail(false);
  }, [setDockInDetail]);

  useEffect(() => {
    if (included) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    readWikiRecipe(current.url, controller.signal, Platform.OS === 'web').then(data => {
      if (active) setResult({ url: current.url, article: data });
    }).catch(() => {
      if (active) setResult({ url: current.url, article: null });
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [current.url, included, retry]);

  function previous() {
    setResult(null);
    setTrail(items => items.length > 1 ? items.slice(0, -1) : items);
  }

  function follow(next: OnlineInspiration) {
    setResult(null);
    setTrail(items => [...items, next]);
  }

  return (
    <Modal animationType="slide" onRequestClose={trail.length > 1 ? previous : onClose}>
      <SafeAreaView style={AppStyles.screen}>
        <View style={styles.header}>
          {trail.length > 1 && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.previous} style={AppStyles.iconButton} onPress={previous}>
              <Ionicons name="chevron-back" size={22} color={AppColors.avocadoText} />
            </TouchableOpacity>
          )}
          <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.recipeClose} style={AppStyles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={22} color={AppColors.avocadoText} />
          </TouchableOpacity>
        </View>
        {article ? (
          <KeyboardAvoidingView style={styles.scroll} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
              key={current.url}
              data={article.blocks}
              keyExtractor={(_, index) => String(index)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.content, !hidden && timers.length > 0 && styles.timerSpace]}
              ListHeaderComponent={
                <>
                  {current.photo && <Image source={current.photo.url} style={styles.photo} contentFit="cover" cachePolicy="disk" />}
                  {(current.minutes !== undefined || current.language !== language) && (
                    <View style={styles.meta}>
                      {current.minutes !== undefined && <Text style={styles.metaText}>{t.recipeEstimatedTime(current.minutes)}</Text>}
                      {current.language !== language && <Text style={styles.metaText}>{current.language.toUpperCase()}</Text>}
                    </View>
                  )}
                  <RecipeNotes target={{ article: { title: current.title, url: current.url, language: current.language } }} />
                </>
              }
              renderItem={({ item }) => {
                if (item.kind === 'heading') return <Text accessibilityRole="header" style={styles.heading}>{item.text}</Text>;
                if (item.kind === 'paragraph') return <Text selectable style={styles.paragraph}>{item.text}</Text>;
                const key = item.href && wikiRecipeKey(item.href, current.url);
                const next = key ? related.get(key) : undefined;
                const action = next && !trail.some(visited => visited.url === next.url);
                return (
                  <View style={[styles.row, { paddingLeft: Math.min(item.depth, 3) * 10 }]}>
                    <Text style={styles.marker}>{item.marker}</Text>
                    {action ? (
                      <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.text} style={styles.related} onPress={() => follow(next)}>
                        <Text style={[styles.item, styles.link]}>{item.text}</Text>
                        <Ionicons name="chevron-forward" size={16} color={AppColors.primaryDark} />
                      </TouchableOpacity>
                    ) : <Text selectable style={styles.item}>{item.text}</Text>}
                  </View>
                );
              }}
              ListFooterComponent={
                <View style={styles.attribution}>
                  <Text style={styles.metaText}>{copy.sourceText}</Text>
                  <View style={styles.meta}>
                    <TouchableOpacity accessibilityRole="link" style={styles.source}
                      onPress={() => void Linking.openURL(article.source).catch(() => {})}>
                      <Text style={styles.link}>Wikibooks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="link" style={styles.source}
                      onPress={() => void Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/').catch(() => {})}>
                      <Text style={styles.link}>CC BY-SA 4.0</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
            />
          </KeyboardAvoidingView>
        ) : !resolved ? <ActivityIndicator style={styles.waiting} size="large" color={AppColors.primaryDark} /> : (
          <View style={styles.error}>
            <Text accessibilityRole="alert" style={styles.paragraph}>{copy.readError}</Text>
            <TouchableOpacity accessibilityRole="button" style={AppStyles.button}
              onPress={() => { setResult(null); setRetry(count => count + 1); }}>
              <Text style={AppStyles.buttonText}>{copy.retry}</Text>
            </TouchableOpacity>
          </View>
        )}
        <TimerDock onLeaveDetail={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18 },
  title: { flex: 1, color: AppColors.text, fontSize: 24, lineHeight: 29, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  timerSpace: { paddingBottom: 148 },
  waiting: { marginTop: 38 },
  error: { padding: 20, gap: 12 },
  photo: { width: '100%', aspectRatio: 1.65, borderRadius: 18, marginBottom: 12, backgroundColor: AppColors.limeTint },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 8 },
  metaText: { color: AppColors.textLight, fontSize: 13, lineHeight: 18 },
  heading: { color: AppColors.text, fontSize: 19, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  paragraph: { color: AppColors.text, fontSize: 15, lineHeight: 23, marginBottom: 10 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, marginBottom: 7 },
  marker: { color: AppColors.primaryDark, minWidth: 21, fontWeight: '600', lineHeight: 23 },
  item: { color: AppColors.text, fontSize: 15, lineHeight: 23, flex: 1 },
  related: { flex: 1, minHeight: 48, alignItems: 'center', flexDirection: 'row', gap: 6 },
  link: { color: AppColors.primaryDark, textDecorationLine: 'underline' },
  source: { minHeight: 48, justifyContent: 'center' },
  attribution: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border, paddingTop: 12, marginTop: 20 },
});
