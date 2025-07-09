import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BeaconStatus } from '@/components/BeaconStatus';
import { AttendanceStats } from '@/components/AttendanceStats';
import { useBeacon } from '@/hooks/useBeacon';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const { isScanning, currentSession, attendanceMarked, isConnected } = useBeacon();
  const router = useRouter();
  const [ongoingClasses, setOngoingClasses] = useState<any[]>([]);
  const [loadingOngoing, setLoadingOngoing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      fetchAttendanceRecords();
    }
  }, [user, fetchAttendanceRecords]);

  const fetchOngoingClasses = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOngoing(true);
    try {
      // Get enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'active');
      if (enrollmentsError) throw enrollmentsError;
      const courseIds = enrollments?.map(e => e.course_id) || [];
      console.log('OngoingClasses: courseIds', courseIds);
      if (courseIds.length === 0) {
        setOngoingClasses([]);
        setLoadingOngoing(false);
        return;
      }
      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      // Get current time in HH:MM:SS
      const now = today.toTimeString().split(' ')[0];
      // Fetch class_sessions for today, for enrolled courses, where now is between start_time and end_time
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('id, course_id, start_time, end_time, attendance_window_start, attendance_window_end, courses(name, code)')
        .in('course_id', courseIds)
        .eq('session_date', todayStr)
        .lte('start_time', now)
        .gte('end_time', now);
      console.log('OngoingClasses: sessions', sessions);
      if (sessionsError) throw sessionsError;
      setOngoingClasses(sessions || []);
    } catch (err) {
      setOngoingClasses([]);
    } finally {
      setLoadingOngoing(false);
    }
  }, [user?.id]);

  const fetchAllDashboardData = useCallback(async () => {
    await Promise.all([
      fetchOngoingClasses(),
      fetchAttendanceRecords(),
    ]);
  }, [fetchOngoingClasses, fetchAttendanceRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllDashboardData();
    setRefreshing(false);
  }, [fetchAllDashboardData]);

  // Add a helper to format time strings to human-friendly local time
  function formatTime(timeStr: string) {
    if (!timeStr) return '';
    // Handles both 'HH:MM:SS' and ISO strings
    const base = '1970-01-01T';
    const t = timeStr.length <= 8 ? timeStr : timeStr.slice(11, 19);
    // No 'Z' at the end, so it's parsed as local time
    const date = new Date(`${base}${t}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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

        {/* Ongoing Classes Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.card, marginBottom: 16 }]}>
          <MaterialCommunityIcons name="clock" size={24} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text, fontSize: 16 }]}>Ongoing Classes</Text>
          {loadingOngoing ? (
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          ) : ongoingClasses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No ongoing classes right now.</Text>
          ) : (
            ongoingClasses.map(session => (
              <View key={session.id} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{session.courses?.name || 'Course'}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{session.courses?.code}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Time: {formatTime(session.start_time)} - {formatTime(session.end_time)}</Text>
                {session.attendance_window_start && session.attendance_window_end && (
                  <View style={{ marginTop: 2, padding: 4, backgroundColor: colors.highlight, borderRadius: 6, alignSelf: 'flex-start' }}>
                    <Text style={{ color: colors.primary, fontSize: 12 }}>
                      Attendance Window: {formatTime(session.attendance_window_start)} - {formatTime(session.attendance_window_end)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
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