import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, SplashScreen, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { useColorScheme, Platform, StatusBar, View, ActivityIndicator } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { useUniversityStore } from "@/store/universityStore";

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
  
  const [isReady, setIsReady] = useState(false);
  const systemColorScheme = useColorScheme();
  const { isSystemTheme, setTheme } = useThemeStore();
  
  // Update theme based on system changes if using system theme
  useEffect(() => {
    if (isSystemTheme && systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme, isSystemTheme, setTheme]);

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw error, just log it and continue
      setIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [error]);

  // Handle successful font loading
  useEffect(() => {
    if (loaded && !error) {
      // Add a small delay to ensure everything is ready, but with timeout
      const timer = setTimeout(() => {
        setIsReady(true);
        SplashScreen.hideAsync().catch(console.error);
      }, 50); // Reduced from 100ms to 50ms
      
      return () => clearTimeout(timer);
    }
  }, [loaded, error]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.warn('Font loading timeout, proceeding anyway');
      setIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
    }, 7000); // 7 second fallback
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  if (!isReady) {
    console.log('Font loading/isReady:', isReady);
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const { university } = useUniversityStore();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (!hydrated) {
    console.log('Auth store not hydrated, showing spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  console.log('Auth store hydrated, rendering app');

  // Redirect admin users to sidebar admin UI
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.replace('/(sidebar)/admin/approvals');
    }
  }, [isAuthenticated, user, router]);

  // Always render the default stack
  return (
    <>
      {/* Fixed status bar handling for mobile to prevent content overlap */}
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={Platform.OS === 'android' ? colors.background : undefined}
        translucent={false} // Changed to false to prevent content overlap
      />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.background,
            // Better header styling for mobile with proper safe area handling
            ...Platform.select({
              ios: {
                shadowColor: colors.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 0,
              },
              android: {
                elevation: 1,
              },
            }),
          },
          headerTintColor: colors.primary,
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
            backgroundColor: colors.background,
          },
          // Better gesture handling for iOS
          gestureEnabled: Platform.OS === 'ios',
          animation: Platform.select({
            ios: 'slide_from_right',
            android: 'slide_from_right',
            default: 'slide_from_right',
          }),
        }}
      >
        <Stack.Screen 
          name="loading" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            title: university?.name || "University",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="courses" 
          options={{ 
            title: "Courses",
            headerLargeTitle: Platform.OS === 'ios',
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            title: "History",
            headerLargeTitle: Platform.OS === 'ios',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: "Settings",
            headerLargeTitle: Platform.OS === 'ios',
          }} 
        />
        <Stack.Screen 
          name="qr-scanner" 
          options={{ 
            presentation: "modal",
            title: "QR Check-in",
            headerTitleAlign: "center",
            // Better modal presentation for mobile
            ...Platform.select({
              ios: {
                headerLeft: () => null,
                gestureEnabled: true,
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
          name="profile" 
          options={{ 
            title: "My Profile",
            headerTitleAlign: "center",
          }} 
        />
        <Stack.Screen 
          name="calendar" 
          options={{ 
            title: "Calendar",
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
      </Stack>
    </>
  );
}