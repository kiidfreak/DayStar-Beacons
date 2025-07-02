import { Stack, useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useUniversityStore } from "@/store/universityStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function AuthLayout() {
  const { colors } = useTheme();
  const { university } = useUniversityStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Handle navigation based on auth and university state
  useEffect(() => {
    if (isAuthenticated) {
      // If already authenticated, go to main app
      router.replace('/');
      return;
    }
  }, [isAuthenticated]);
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
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