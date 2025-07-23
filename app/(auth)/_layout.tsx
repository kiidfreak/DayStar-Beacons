import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { useUniversityStore } from "@/store/universityStore";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useEffect } from "react";
import React from "react";

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeColors } = useThemeStore();
  const { university } = useUniversityStore();
  const { isAuthenticated, user, error } = useAuthStore();
  const router = useRouter();
  
  // Fallback theme colors
  const safeThemeColors = themeColors || {
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
  
  // Simplified navigation - let the main layout handle navigation
  React.useEffect(() => {
    console.log('Auth layout - initial navigation check');
    console.log('isAuthenticated:', isAuthenticated, 'user:', user?.id, 'university:', university, 'error:', error);
    
    // Don't navigate here - let the main layout handle it
    console.log('Auth layout - staying on current screen');
  }, [isAuthenticated, user, university, error]);
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: safeThemeColors.background,
        },
        headerTintColor: safeThemeColors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: safeThemeColors.background,
        },
      }}
    >
      <Stack.Screen
        name="select-university"
        options={{
          title: "Select University",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Sign Up",
          headerShown: false,
        }}
      />
    </Stack>
  );
}