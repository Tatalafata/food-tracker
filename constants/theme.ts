import { Platform, StyleSheet } from 'react-native';

export const AppColors = {
  primary: '#DCE8C0',
  onPrimary: '#303A22',
  primaryDark: '#52672F',
  primaryLight: '#9EAE81',
  accent: '#BDCD94',
  action: '#FCC33F',
  actionText: '#3D2F16',
  surfaceTint: '#EAF0D9',
  avocado: '#D2DFA8',
  avocadoText: '#394926',
  limeTint: '#EFF3DF',
  limeBorder: '#D7E0BD',
  warmTint: '#FFF0CB',
  surface: '#FEFEF7',
  background: '#F6F7E9',
  white: '#FFFFFF',
  expired: '#A1353D',
  expiredBg: '#FCECEE',
  warning: '#795211',
  warningBg: '#FFF1CB',
  good: '#52672F',
  goodBg: '#EBF1D9',
  text: '#2D3622',
  textLight: '#586047',
  border: '#DEE4CB',
  cardShadow: 'rgba(45, 54, 34, 0.06)',
};

export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primaryDark,
    icon: AppColors.textLight,
    tabIconDefault: AppColors.textLight,
    tabIconSelected: AppColors.primaryDark,
  },
  dark: {
    text: '#EFF3DF',
    background: '#222B19',
    tint: '#DCE8C0',
    icon: '#B8C59D',
    tabIconDefault: '#9EAE81',
    tabIconSelected: '#DCE8C0',
  },
};

// Shared native styles keep the same visual language on every screen.
export const AppStyles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: AppColors.background },
  card: { backgroundColor: AppColors.surface, borderRadius: 22, borderWidth: 1, borderColor: AppColors.limeBorder },
  input: {
    minHeight: 56, borderWidth: 1, borderColor: AppColors.border, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: AppColors.text, backgroundColor: AppColors.white,
  },
  button: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 18, backgroundColor: AppColors.action, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600', color: AppColors.actionText },
  iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: AppColors.limeTint, alignItems: 'center', justifyContent: 'center' },
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
