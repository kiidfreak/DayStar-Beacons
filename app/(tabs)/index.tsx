import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  console.log('HomeScreen - rendering with user:', user?.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/qr-scanner');
        break;
      case 'courses':
        router.push('/(tabs)/courses');
        break;
      case 'history':
        router.push('/(tabs)/history');
        break;
      case 'settings':
        router.push('/(tabs)/settings');
        break;
    }
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
            onPress={() => handleQuickAction('settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => handleQuickAction('scan')}
          >
            <Ionicons name="qr-code" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => handleQuickAction('courses')}
          >
            <Ionicons name="book" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>View Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => handleQuickAction('history')}
          >
            <Ionicons name="time" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Attendance History</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View style={[styles.welcomeCard, { backgroundColor: themeColors.card }]}>
          <MaterialCommunityIcons name="school" size={32} color={themeColors.primary} />
          <Text style={[styles.welcomeTitle, { color: themeColors.text }]}>
            Welcome to Daystar University
          </Text>
          <Text style={[styles.welcomeMessage, { color: themeColors.textSecondary }]}>
            The app is working! You can now navigate between tabs.
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
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 