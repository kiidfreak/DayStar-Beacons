import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (pathname === '/admin' || pathname === '/(sidebar)/admin') {
      router.replace('/admin/approvals');
    }
  }, [pathname, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>Welcome, {user?.name || 'Admin'}!</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Redirecting to your dashboard...</Text>
    </View>
  );
} 