import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.welcomeName, { color: themeColors.text }]}>
              {user?.firstName || 'Student'}!
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Courses Section */}
        <View style={[styles.coursesCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open" size={24} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              My Courses
            </Text>
          </View>
          
          <Text style={[styles.coursesMessage, { color: themeColors.textSecondary }]}>
            Course management features will be available soon. You can view your enrolled courses and manage your schedule here.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="home" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
          <MaterialCommunityIcons name="rocket-launch" size={32} color={themeColors.primary} />
          <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
            Course Features Coming Soon
          </Text>
          <Text style={[styles.comingSoonMessage, { color: themeColors.textSecondary }]}>
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