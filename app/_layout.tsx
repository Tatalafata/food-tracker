import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AppColors } from '@/constants/theme';
import { TimerDock } from '@/components/CookingTimers';
import { DietaryPreferencesProvider } from '@/store/dietary-preferences';
import { I18nProvider } from '@/store/i18n';
import { KitchenProvider } from '@/store/kitchen';
import { NotificationPrefsProvider } from '@/store/notifications';
import { PantryProvider } from '@/store/pantry';
import { RecipeBookProvider } from '@/store/recipe-book';
import { RecipePlansProvider } from '@/store/recipe-plans';
import { TimersProvider } from '@/store/timers';

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
          <RecipePlansProvider>
            <DietaryPreferencesProvider>
              <RecipeBookProvider>
                <KitchenProvider>
                  <TimersProvider>
                    <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: AppColors.background, primary: AppColors.primaryDark } }}>
                      <View style={{ flex: 1 }}>
                        <Stack>
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="add-product" options={{ presentation: 'modal', headerShown: false }} />
                          <Stack.Screen name="recipe-book" options={{ headerShown: false }} />
                          <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
                          <Stack.Screen name="kitchen-equipment" options={{ headerShown: false }} />
                          <Stack.Screen name="feedback" options={{ headerShown: false }} />
                          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                        </Stack>
                        <TimerDock />
                      </View>
                      <StatusBar style="dark" />
                    </ThemeProvider>
                  </TimersProvider>
                </KitchenProvider>
              </RecipeBookProvider>
            </DietaryPreferencesProvider>
          </RecipePlansProvider>
        </PantryProvider>
      </NotificationPrefsProvider>
    </I18nProvider>
  );
}
