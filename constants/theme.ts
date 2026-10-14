import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  light: {
    text: '#293D32',
    background: '#F7F8F3',
    tint: '#476B55',
    icon: '#6D7A70',
    tabIconDefault: '#6D7A70',
    tabIconSelected: '#476B55',
  },
  dark: {
    text: '#D8F3DC',
    background: '#0D1F17',
    tint: '#74C69D',
    icon: '#95D5B2',
    tabIconDefault: '#52796F',
    tabIconSelected: '#74C69D',
  },
};

export const AppColors = {
  primary: '#C5DDCB',
  onPrimary: '#294B35',
  primaryDark: '#476B55',
  primaryLight: '#8BAF96',
  accent: '#ADCCB6',
  surfaceTint: '#EDF3EB',
  avocado: '#CBD9A4',
  avocadoText: '#43562E',
  limeTint: '#EEF2DC',
  limeBorder: '#D9E2BB',
  warmTint: '#F5EBDF',
  background: '#F7F8F3',
  white: '#FFFFFF',
  expired: '#A8464F',
  expiredBg: '#FBECEE',
  warning: '#94651D',
  warningBg: '#FAF1DF',
  good: '#476B55',
  goodBg: '#EDF3EB',
  text: '#293D32',
  textLight: '#6D7A70',
  border: '#E2E8DE',
  cardShadow: 'rgba(41, 61, 50, 0.04)',
};

// Shared native styles keep the same visual language on every screen.
export const AppStyles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: AppColors.background },
  card: { backgroundColor: AppColors.white, borderRadius: 22, borderWidth: 1, borderColor: AppColors.border },
  input: {
    minHeight: 56, borderWidth: 1, borderColor: AppColors.border, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: AppColors.text, backgroundColor: AppColors.white,
  },
  button: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 18, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600', color: AppColors.onPrimary },
  iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: AppColors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
});

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
