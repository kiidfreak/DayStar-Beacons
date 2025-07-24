import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BeaconStatus } from '@/components/BeaconStatus';
import { AttendanceStats } from '@/components/AttendanceStats';
import { useBeacon } from '@/hooks/useBeacon';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const { isScanning, currentSession, attendanceMarked, isConnected } = useBeacon();
  const router = useRouter();

  console.log('HomeScreen: Rendering with user:', user?.id);

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
    console.log('HomeScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('HomeScreen: Fetching attendance records for user:', user.id);
      fetchAttendanceRecords();
      // Optionally, trigger other fetches for courses/stats if needed
    }
  }, [user, fetchAttendanceRecords]);

  // Refresh attendance records when component mounts or user changes
  useEffect(() => {
    if (user) {
      const refreshData = async () => {
        try {
          await fetchAttendanceRecords();
        } catch (error) {
          console.error('Error refreshing attendance records:', error);
        }
      };
      refreshData();
    }
  }, [user]);

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
            onPress={() => handleQuickAction('settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Beacon Status */}
        <BeaconStatus />

        {/* Attendance Stats */}
        <AttendanceStats />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => handleQuickAction('scan')}
          >
            <Ionicons name="qr-code" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => handleQuickAction('courses')}
          >
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>View Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => handleQuickAction('history')}
          >
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Attendance History</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="school" size={32} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome to Daystar University
          </Text>
          <Text style={[styles.welcomeMessage, { color: colors.textSecondary }]}>
            Use the QR code scanner to record your attendance when your instructor displays a QR code.
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
  sessionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
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
  successCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.9,
  },
}); 