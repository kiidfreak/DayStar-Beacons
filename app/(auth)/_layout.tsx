import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { useUniversityStore } from "@/store/universityStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import React from "react";
import colors from '@/constants/colors';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = colors[isDark ? 'dark' : 'light'];
  const { university } = useUniversityStore();
  const { isAuthenticated, user, error } = useAuthStore();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = React.useState(false);
  
  // Handle initial navigation when app starts
  React.useEffect(() => {
    if (!hasNavigated) {
      console.log('Auth layout - initial navigation check');
      console.log('isAuthenticated:', isAuthenticated, 'user:', user?.id, 'university:', university, 'error:', error);
      
      // Don't navigate if there's a login error
      if (error) {
        console.log('Auth layout - login error detected, not navigating');
        return;
      }
      
      if (isAuthenticated && user) {
        console.log('Auth layout - navigating to tabs (authenticated)');
        setHasNavigated(true);
        setTimeout(() => {
          try {
            router.replace('/(tabs)');
          } catch (error) {
            console.error('Auth layout navigation error:', error);
          }
        }, 100);
      } else if (university) {
        console.log('Auth layout - navigating to login (university selected)');
        setHasNavigated(true);
        setTimeout(() => {
          try {
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Auth layout navigation error:', error);
          }
        }, 100);
      } else {
        console.log('Auth layout - staying on university selection (default)');
        setHasNavigated(true);
      }
    }
  }, [isAuthenticated, user, university, error, router, hasNavigated]);
  
  // Handle navigation based on auth state with error handling
  useEffect(() => {
    // Don't navigate if there's a login error
    if (error) {
      console.log('Auth layout - login error detected, not navigating');
      return;
    }
    
    if (isAuthenticated && user && !hasNavigated) {
      console.log('Auth layout - navigating to tabs');
      setHasNavigated(true);
      setTimeout(() => {
        try {
          router.replace('/(tabs)');
        } catch (error) {
          console.error('Auth layout navigation error:', error);
        }
      }, 100);
    }
  }, [isAuthenticated, user, error, router, hasNavigated]);
  

  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: themeColors.background,
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
    </Stack>
  );
}