import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppColors } from '@/constants/theme';
import { I18nProvider } from '@/store/i18n';
import { NotificationPrefsProvider } from '@/store/notifications';
import { PantryProvider } from '@/store/pantry';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <I18nProvider>
      <NotificationPrefsProvider>
        <PantryProvider>
          <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: AppColors.background, primary: AppColors.primaryDark } }}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="add-product" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </PantryProvider>
      </NotificationPrefsProvider>
    </I18nProvider>
  );
}
