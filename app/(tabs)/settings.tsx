import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();

  console.log('SettingsScreen: Rendering with user:', user?.id);

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

  useEffect(() => {
    console.log('SettingsScreen: useEffect triggered');
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.welcomeName, { color: colors.text }]}>
              {user?.firstName || 'Student'}!
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Settings
            </Text>
          </View>
          
          <Text style={[styles.settingsMessage, { color: colors.textSecondary }]}>
            Manage your account settings, preferences, and app configuration here.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/courses')}
          >
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="tools" size={32} color={colors.primary} />
          <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
            Settings Features Coming Soon
          </Text>
          <Text style={[styles.comingSoonMessage, { color: colors.textSecondary }]}>
            We're working on bringing you comprehensive settings with theme customization, notifications, and account management.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  settingsMessage: {
    fontSize: 16,
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  comingSoonCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});