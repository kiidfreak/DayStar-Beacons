import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BeaconStatus } from '@/components/BeaconStatus';
import { AttendanceStats } from '@/components/AttendanceStats';
import { useBeacon } from '@/hooks/useBeacon';
import { AttendanceService } from '@/services/attendanceService';
import { ClassSession } from '@/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords, attendanceRecords, markAttendance, isLoading } = useAttendanceStore();
  const { isScanning, currentSession, attendanceMarked, isConnected } = useBeacon();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<ClassSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  console.log('HomeScreen: Rendering with user:', user?.id);

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#3B82F6',
    secondary: '#2563EB',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    inactive: '#9CA3AF',
    highlight: '#EFF6FF',
  };

  // Animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch today's sessions
  const fetchTodaysSessions = async () => {
    if (!user) return;
    
    setLoadingSessions(true);
    try {
      const sessions = await AttendanceService.getTodaysSessions(user.id);
      setTodaysSessions(sessions);
      console.log('Fetched today\'s sessions:', sessions.length);
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    console.log('HomeScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('HomeScreen: Fetching attendance records for user:', user.id);
      fetchAttendanceRecords();
      fetchTodaysSessions();
    }
  }, [user, fetchAttendanceRecords]);

  // Refresh attendance records when component mounts or user changes
  useEffect(() => {
    if (user) {
      const refreshData = async () => {
        try {
          await fetchAttendanceRecords();
          await fetchTodaysSessions();
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
      refreshData();
    }
  }, [user]);

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
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
      default:
        break;
    }
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // Check if attendance is marked for a session
  const isAttendanceMarked = (sessionId: string) => {
    return attendanceRecords.some(record => record.session_id === sessionId);
  };

  // Get attendance record for a session
  const getAttendanceRecord = (sessionId: string) => {
    return attendanceRecords.find(record => record.session_id === sessionId);
  };

  // Handle attendance marking
  const handleMarkAttendance = async (sessionId: string, method: 'qr' | 'beacon' | 'manual') => {
    if (!user) return;
    
    try {
      const success = await markAttendance(sessionId, method);
      if (success) {
        console.log('Attendance marked successfully');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format session time range
  const formatSessionTime = (startTime: string, endTime: string) => {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    return `${start} - ${end}`;
  };

  // Get attendance status color
  const getAttendanceStatusColor = (sessionId: string) => {
    const record = getAttendanceRecord(sessionId);
    if (!record) return colors.inactive;
    
    switch (record.status) {
      case 'present':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'absent':
        return colors.error;
      default:
        return colors.inactive;
    }
  };

  // Get attendance status text
  const getAttendanceStatusText = (sessionId: string) => {
    const record = getAttendanceRecord(sessionId);
    if (!record) return 'Not marked';
    
    switch (record.status) {
      case 'present':
        return 'Present';
      case 'pending':
        return 'Pending';
      case 'absent':
        return 'Absent';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Main Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Attendance Check
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getCurrentDate()}
          </Text>
        </Animated.View>

        {/* Today's Classes Section */}
        <Animated.View 
          style={[
            styles.classesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Classes
          </Text>
          
          {loadingSessions ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading today's classes...
              </Text>
            </View>
          ) : todaysSessions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No classes scheduled for today
              </Text>
            </View>
          ) : (
            todaysSessions.map((session, index) => {
              const isMarked = isAttendanceMarked(session.id);
              const attendanceRecord = getAttendanceRecord(session.id);
              const statusColor = getAttendanceStatusColor(session.id);
              const statusText = getAttendanceStatusText(session.id);
              
              return (
                <View key={session.id} style={[styles.classCard, { backgroundColor: colors.card }]}>
                  <TouchableOpacity 
                    style={styles.classHeader}
                    onPress={() => toggleCardExpansion(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.classInfo}>
                      <Text style={[styles.classTitle, { color: colors.text }]}>
                        {session.course?.name || 'Unknown Course'}
                      </Text>
                    </View>
                    <View style={styles.classHeaderRight}>
                      <View style={[styles.classCode, { backgroundColor: colors.primary }]}>
                        <Text style={styles.classCodeText}>
                          {session.course?.code || 'N/A'}
                        </Text>
                      </View>
                      {isMarked && (
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusText}>{statusText}</Text>
                        </View>
                      )}
                      <Ionicons 
                        name={expandedCard === index ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.classDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {formatSessionTime(session.startTime, session.endTime)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {session.location || 'Location TBD'}
                      </Text>
                    </View>
                    {expandedCard === index && (
                      <>
                        <View style={styles.detailRow}>
                          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.text }]}>
                            Lecturer: {session.course?.instructor?.name || 'TBD'}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.text }]}>
                            Date: {new Date(session.sessionDate).toLocaleDateString()}
                          </Text>
                        </View>
                        
                        {attendanceRecord && (
                          <View style={styles.detailRow}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.text }]}>
                              Check-in: {formatTime(attendanceRecord.check_in_time)}
                            </Text>
                          </View>
                        )}
                        
                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                          {!isMarked ? (
                            <>
                              <TouchableOpacity 
                                style={[styles.actionButton, { borderColor: colors.border }]}
                                onPress={() => handleMarkAttendance(session.id, 'qr')}
                                disabled={isLoading}
                              >
                                <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.textSecondary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Scan QR</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.actionButton, { borderColor: colors.border }]}
                                onPress={() => handleMarkAttendance(session.id, 'beacon')}
                                disabled={isLoading}
                              >
                                <MaterialCommunityIcons name="bluetooth" size={16} color={colors.textSecondary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Beacon</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.actionButton, { borderColor: colors.border }]}
                                onPress={() => handleMarkAttendance(session.id, 'manual')}
                                disabled={isLoading}
                              >
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>Manual</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={[styles.attendanceMarkedContainer, { backgroundColor: colors.highlight }]}>
                              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                              <Text style={[styles.attendanceMarkedText, { color: colors.success }]}>
                                Attendance Marked
                              </Text>
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  titleContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  classesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  classCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  classHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classCode: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  classCodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceMarkedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  attendanceMarkedText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 