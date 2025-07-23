import React from 'react';
import { Platform, Dimensions, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const fallbackThemeColors = {
  background: '#FFFFFF',
  card: '#F7F9FC',
  text: '#1A1D1F',
  textSecondary: '#6C7072',
  primary: '#00AEEF',
  secondary: '#3DDAB4',
  border: '#E8ECF4',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  inactive: '#C5C6C7',
  highlight: '#E6F7FE',
};

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeColors } = useThemeStore();
  const { user } = useAuthStore();

  // Bulletproof fallback
  const safeThemeColors = (themeColors && typeof themeColors === 'object') ? themeColors : fallbackThemeColors;

  console.log('TabsLayout - user:', user?.id, 'isDark:', isDark);

  // Simple check: if no user, just show loading
  if (!user || !user.id) {
    console.log('TabsLayout - no user, showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: safeThemeColors.background }}>
        <Text style={{ color: safeThemeColors.text, fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  console.log('TabsLayout - rendering tabs with user:', user.id);

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#F7F9FC',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#00AEEF',
    secondary: '#3DDAB4',
    border: '#E8ECF4',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    inactive: '#C5C6C7',
    highlight: '#E6F7FE',
  };

  console.log('TabsLayout: Rendering with colors:', colors.primary);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          console.log('🎯 Tab pressed:', e.target);
          console.log('🎯 Tab route:', e.target);
          console.log('🎯 Tab navigation state:', e.target);
        },
        focus: (e) => {
          console.log('🎯 Tab focused:', e.target);
        },
        blur: (e) => {
          console.log('🎯 Tab blurred:', e.target);
        },
        state: (e) => {
          console.log('🎯 Tab state changed:', e.data);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => {
            console.log('Dashboard icon rendered with color:', color);
            return <Ionicons name="home" size={size} color={color} />;
          },
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Dashboard tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => {
            console.log('Courses icon rendered with color:', color);
            return <Ionicons name="book" size={size} color={color} />;
          },
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Courses tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => {
            console.log('History icon rendered with color:', color);
            return <Ionicons name="time" size={size} color={color} />;
          },
        }}
        listeners={{
          tabPress: (e) => {
            console.log('History tab pressed');
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => {
            console.log('Settings icon rendered with color:', color);
            return <Ionicons name="settings" size={size} color={color} />;
          },
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Settings tab pressed');
          },
        }}
      />
    </Tabs>
  );
}