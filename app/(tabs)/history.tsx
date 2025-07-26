import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AttendanceService } from '@/services/attendanceService';

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ total: number; present: number; absent: number }>({ total: 0, present: 0, absent: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = async () => {
    if (user?.id) {
      setRefreshing(true);
      try {
        const data = await AttendanceService.getStudentAttendance(user.id);
        setRecords(data);
        // Calculate analytics
        const present = data.filter(r => r.status === 'present').length;
        // Fetch all past sessions for the user
        const pastSessions = await AttendanceService.getPastSessionsForUser(user.id);
        // Build a set of session IDs the user attended
        const attendedSessionIds = new Set(data.map(r => r.session_id));
        // Count absents: sessions with no attendance record
        const absent = pastSessions.filter(session => !attendedSessionIds.has(session.id)).length;
        const total = present + absent;
        setAnalytics({ total, present, absent });
      } catch {
        setRecords([]);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user?.id]);

  const onRefresh = () => {
    fetchAttendance();
  };

  console.log('HistoryScreen: Rendering with user:', user?.id);

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
    console.log('HistoryScreen: useEffect triggered');
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
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
            onPress={() => router.push('/(tabs)/settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Attendance Analytics */}
        <View style={[styles.historyCard, { backgroundColor: colors.card, marginBottom: 12 }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-bar" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendance Analytics
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary }}>Total Records: {analytics.total}</Text>
          <Text style={{ color: colors.success }}>Present: {analytics.present}</Text>
          <Text style={{ color: colors.error }}>Absent: {analytics.absent}</Text>
        </View>

        {/* History Section */}
        <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendance History
            </Text>
          </View>
          {loading ? (
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          ) : records.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No attendance records found.</Text>
          ) : (
            records.map(record => {
              const isOpen = expanded === record.id;
              return (
                <View key={record.id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setExpanded(isOpen ? null : record.id)}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                      {record.courseName || record.courseCode}
                      {record.courseCode && record.courseName && (
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}> ({record.courseCode})</Text>
                      )}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{record.date} • {record.status}</Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={{ marginTop: 6, paddingLeft: 8 }}>
                      {record.checkInTime && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Check-in: {new Date(record.checkInTime).toLocaleTimeString()}</Text>}
                      {record.checkOutTime && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Check-out: {new Date(record.checkOutTime).toLocaleTimeString()}</Text>}
                      {record.method && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Method: {record.method}</Text>}
                      {(record.latitude && record.longitude) && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Location: {record.latitude}, {record.longitude}</Text>}
                      {record.verifiedBy && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Verified By: {record.verifiedBy}</Text>}
                      {record.verifiedAt && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Verified At: {new Date(record.verifiedAt).toLocaleString()}</Text>}
                      {record.location && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Session Location: {record.location}</Text>}
                    </View>
                  )}
                </View>
              );
            })
          )}
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
  historyCard: {
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
  historyMessage: {
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