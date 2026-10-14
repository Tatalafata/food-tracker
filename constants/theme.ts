import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B4332',
    background: '#F8FDF9',
    tint: '#2D6A4F',
    icon: '#52796F',
    tabIconDefault: '#84A98C',
    tabIconSelected: '#2D6A4F',
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
  primary: '#2D6A4F',
  primaryDark: '#1B4332',
  primaryLight: '#40916C',
  accent: '#74C69D',
  background: '#F8FDF9',
  white: '#FFFFFF',
  expired: '#C62828',
  expiredBg: '#FFEBEE',
  warning: '#E65100',
  warningBg: '#FFF3E0',
  good: '#2E7D32',
  goodBg: '#E8F5E9',
  text: '#1B4332',
  textLight: '#52796F',
  border: '#D8F3DC',
  cardShadow: 'rgba(45, 106, 79, 0.12)',
};

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
