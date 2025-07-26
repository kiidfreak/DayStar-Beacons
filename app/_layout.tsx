import React from 'react';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, SplashScreen, useRouter, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useColorScheme, Platform, StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import colors from '@/constants/colors';

import { useUniversityStore } from "@/store/universityStore";
import { useAttendanceStore } from '@/store/attendanceStore';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import Toast from 'react-native-toast-message';

export const unstable_settings = {
  // Make sure the app starts with loading screen
  initialRouteName: "loading",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  
  const { isAuthenticated, hydrated, justLoggedOut } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded && !error) {
      // Set ready immediately when fonts are loaded
      setIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
      
      // Don't navigate here - let RootLayoutNav handle navigation
    }
  }, [loaded, error]);

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw error, just log it and continue
      setIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [error]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.warn('Font loading timeout, proceeding anyway');
      setIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
    }, 3000); // Reduced to 3 seconds
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  const pathname = usePathname();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 18, color: '#00AEEF' }}>Loading...</Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function Banner() {
  const { bannerMessage, clearBannerMessage } = useAttendanceStore();
  const { themeColors } = useThemeStore();
  
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

  useEffect(() => {
    if (bannerMessage) {
      const timer = setTimeout(() => clearBannerMessage(), 3000);
      return () => clearTimeout(timer);
    }
  }, [bannerMessage]);
  
  if (!bannerMessage) return null;
  
  return (
    <View style={{
      position: 'absolute',
      top: 24,
      left: 0,
      right: 0,
      backgroundColor: safeThemeColors.error,
      paddingVertical: 8,
      paddingHorizontal: 16,
      zIndex: 9999,
      borderRadius: 8,
      marginHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
      maxWidth: 400,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <Text
        style={{ color: 'white', textAlign: 'center', fontSize: 13, flexShrink: 1, marginRight: 8 }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {bannerMessage}
      </Text>
      <TouchableOpacity
        onPress={clearBannerMessage}
        style={{ padding: 4 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutNav() {
  // Move all hooks to the top - ALWAYS call them in the same order
  const { isAuthenticated, user, hydrated, justLoggedOut, setJustLoggedOut } = useAuthStore();
  const { university } = useUniversityStore();
  const { themeColors, isDark } = useThemeStore();
  const router = useRouter();
  const { bannerMessage, startRealtimeSubscriptions, stopRealtimeSubscriptions } = useAttendanceStore();
  const pathname = usePathname();

  // Fallback theme colors to prevent undefined errors
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

  // Start real-time subscriptions when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Starting real-time subscriptions...');
      startRealtimeSubscriptions();
    } else {
      console.log('Stopping real-time subscriptions...');
      stopRealtimeSubscriptions();
    }

    return () => {
      stopRealtimeSubscriptions();
    };
  }, [isAuthenticated, user, startRealtimeSubscriptions, stopRealtimeSubscriptions]);

  // Improved navigation logic
  React.useEffect(() => {
    if (hydrated) {
      console.log('Navigation check - isAuthenticated:', isAuthenticated, 'user:', user?.id, 'university:', university, 'pathname:', pathname);
      const currentPath = pathname || '';
      const isOnAuth = currentPath.startsWith('/(auth)');
      const isOnLogin = currentPath === '/(auth)/login';
      const isOnSelectUniversity = currentPath === '/(auth)/select-university';
      const isOnTabs = currentPath.startsWith('/(tabs)') || 
                      currentPath === '/' || 
                      currentPath === '/courses' || 
                      currentPath === '/history' || 
                      currentPath === '/settings';
      const isOnChangePassword = currentPath === '/change-password';
      const isOnQRScanner = currentPath === '/qr-scanner';

      console.log('Navigation paths - isOnAuth:', isOnAuth, 'isOnLogin:', isOnLogin, 'isOnSelectUniversity:', isOnSelectUniversity, 'isOnTabs:', isOnTabs, 'isOnQRScanner:', isOnQRScanner);
      console.log('Current path details:', { currentPath, pathname, isOnTabs });

      if (!university) {
        if (!isOnSelectUniversity) {
          console.log('No university selected, navigating to university selection');
          router.replace('/(auth)/select-university');
        }
      } else if (!isAuthenticated || !user) {
        const isOnRegister = currentPath === '/(auth)/register' || currentPath === '/register' || currentPath.endsWith('/register');
        if (!isOnLogin && !isOnRegister) {
          console.log('University selected, not authenticated, navigating to login');
          router.replace('/(auth)/login');
        }
      } else {
        // Only navigate to tabs if not already on tabs, auth, change-password, or qr-scanner page
        if (!isOnTabs && !isOnAuth && !isOnChangePassword && !isOnQRScanner) {
          console.log('Authenticated, navigating to tabs index');
          router.replace('/(tabs)');
        } else {
          console.log('Already on tabs, auth, change-password, or qr-scanner, no navigation needed');
        }
      }
    }
  }, [hydrated, isAuthenticated, user, university, router, pathname]);

  // Handle logout navigation
  React.useEffect(() => {
    if (justLoggedOut) {
      setTimeout(() => {
        try {
          router.replace('/(auth)/select-university');
          setJustLoggedOut(false);
        } catch (error) {
          console.error('Logout navigation error:', error);
        }
      }, 200);
    }
  }, [justLoggedOut, router, setJustLoggedOut]);

  // Always render the default stack
  return (
    <>
      <Banner />
      {/* Fixed status bar handling for mobile to prevent content overlap */}
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={Platform.OS === 'android' ? safeThemeColors.background : undefined}
        translucent={false} // Changed to false to prevent content overlap
      />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: safeThemeColors.background,
            // Better header styling for mobile with proper safe area handling
            ...Platform.select({
              ios: {
                shadowColor: safeThemeColors.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 0,
              },
              android: {
                elevation: 1,
              },
            }),
          },
          headerTintColor: safeThemeColors.primary,
          headerTitleStyle: {
            fontWeight: '600',
            // Better title styling for mobile
            ...Platform.select({
              ios: {
                fontSize: 17,
                fontWeight: '600',
              },
              android: {
                fontSize: 20,
                fontWeight: '500',
              },
            }),
          },
          contentStyle: {
            backgroundColor: safeThemeColors.background,
          },
          // Better gesture handling - only enable for specific screens
          gestureEnabled: false, // Disable global gestures to prevent conflicts
          animation: Platform.select({
            ios: 'slide_from_right',
            android: 'slide_from_right',
            default: 'slide_from_right',
          }),
        }}
        initialRouteName="(auth)"
      >
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="qr-scanner" 
          options={{ 
            presentation: "modal",
            title: "QR Check-in",
            headerTitleAlign: "center",
            gestureEnabled: true, // Enable gestures for modal
            ...Platform.select({
              ios: {
                headerLeft: () => null,
              },
            }),
          }} 
        />
        <Stack.Screen 
          name="course/[id]" 
          options={{ 
            title: "Course Details",
            headerTitleAlign: "center",
          }} 
        />
        <Stack.Screen 
          name="change-password" 
          options={{ 
            title: "Change Password",
            headerTitleAlign: "center",
          }} 
        />
        <Stack.Screen 
          name="faq" 
          options={{ 
            title: "FAQ",
            headerTitleAlign: "center",
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Disable gestures for tabs to prevent conflicts
          }} 
        />
      </Stack>
      <Toast />
    </>
  );
}