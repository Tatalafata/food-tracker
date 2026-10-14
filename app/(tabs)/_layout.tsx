import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/theme';
import { useI18n } from '@/store/i18n';

export default function TabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const tabIcon = (name: React.ComponentProps<typeof Ionicons>['name']) =>
    function TabIcon({ color, focused }: { color: string; focused: boolean }) {
      return (
        <View style={{ width: 44, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? AppColors.surfaceTint : 'transparent' }}>
          <Ionicons name={name} size={21} color={color} />
        </View>
      );
    };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primaryDark,
        tabBarInactiveTintColor: AppColors.textLight,
        headerShown: false,
        sceneStyle: { backgroundColor: AppColors.background },
        tabBarButton: HapticTab,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, height: 14, fontWeight: '500', marginTop: 4, marginHorizontal: 0 },
        tabBarItemStyle: { minHeight: 56, paddingVertical: 0 },
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopColor: AppColors.border,
          height: 78 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 4,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: tabIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: t.tabPantry,
          tabBarIcon: tabIcon('basket-outline'),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t.tabScan,
          tabBarIcon: tabIcon('scan-outline'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabCalendar,
          tabBarIcon: tabIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t.tabRecipes,
          tabBarIcon: tabIcon('restaurant-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: tabIcon('options-outline'),
        }}
      />
    </Tabs>
  );
}
