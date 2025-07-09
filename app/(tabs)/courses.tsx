import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();

  console.log('CoursesScreen: Rendering with user:', user?.id);

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
    console.log('CoursesScreen: useEffect triggered');
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

        {/* Courses Section */}
        <View style={[styles.coursesCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Courses
            </Text>
          </View>
          
          <Text style={[styles.coursesMessage, { color: colors.textSecondary }]}>
            Course management features will be available soon. You can view your enrolled courses and manage your schedule here.
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
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Test Navigation */}
        <View style={[styles.testCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.testTitle, { color: colors.text }]}>
            Navigation Test
          </Text>
          <Text style={[styles.testText, { color: colors.textSecondary }]}>
            If you can see this, you're on the Courses tab!
          </Text>
        </View>

        {/* Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="rocket-launch" size={32} color={colors.primary} />
          <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
            Course Features Coming Soon
          </Text>
          <Text style={[styles.comingSoonMessage, { color: colors.textSecondary }]}>
            We're working on bringing you full course management capabilities including enrollment, schedules, and attendance tracking.
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
  coursesCard: {
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
  coursesMessage: {
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
  testCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  testText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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