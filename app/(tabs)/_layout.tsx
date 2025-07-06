import React from 'react';
import { Platform, Dimensions, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = colors[isDark ? 'dark' : 'light'];
  const { user } = useAuthStore();

  console.log('TabsLayout - user:', user?.id, 'isDark:', isDark);
  console.log('TabsLayout - user object:', JSON.stringify(user, null, 2));

  if (!user) {
    console.log('TabsLayout - no user, showing fallback');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.text, fontSize: 18 }}>Loading...</Text>
        <Text style={{ color: themeColors.textSecondary, fontSize: 14, marginTop: 8 }}>
          User not found: {JSON.stringify(user)}
        </Text>
      </View>
    );
  }

  console.log('TabsLayout - rendering tabs with user:', user.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}