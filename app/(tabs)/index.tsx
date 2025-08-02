import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
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
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { 
    attendanceRecords, 
    isLoading, 
    error, 
    bannerMessage, 
    fetchAttendanceRecords, 
    markAttendance,
    markCheckout,
    setBannerMessage 
  } = useAttendanceStore();
  
  // BLE functionality - background scanning and automatic attendance
  const { 
    isScanning, 
    currentSession, 
    attendanceMarked, 
    isConnected,
    startContinuousScanning,
    stopContinuousScanning,
    requestBluetoothPermissions,
    automaticAttendanceEnabled,
    setAutomaticAttendanceEnabled
  } = useBeacon();
  
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<ClassSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

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

  // Initialize BLE background scanning when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('HomeScreen: User authenticated, BLE background scanning will start automatically');
      // The useBeacon hook handles all BLE initialization automatically
    }
  }, [user]);

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

  // Cleanup BLE scanning when component unmounts
  useEffect(() => {
    return () => {
      console.log('HomeScreen: Cleaning up BLE scanning');
      stopContinuousScanning();
    };
  }, [stopContinuousScanning]);

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

  // Handle attendance marking
  const handleMarkAttendance = async (sessionId: string, action: 'checkIn' | 'checkOut' | 'scanQR') => {
    if (!user) {
      console.log('No user found, cannot mark attendance');
      return;
    }
    
    try {
      let method: 'qr' | 'beacon' | 'manual';
      
      switch (action) {
        case 'checkIn':
          method = 'manual';
          console.log('Checking in for session:', sessionId);
          const checkInSuccess = await markAttendance(sessionId, method);
          if (checkInSuccess) {
            console.log('✅ Check-in successful');
          }
          break;
        case 'checkOut':
          // Use BeaconStatus checkout implementation
          Alert.alert(
            'Check Out',
            'Are you sure you want to check out and log your attendance sign out time?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Check Out', 
                style: 'destructive', 
                onPress: () => {
                  setPendingCheckout(true);
                  // Store sessionId for checkout
                  setCurrentCheckoutSession(sessionId);
                }
              },
            ]
          );
          break;
        case 'scanQR':
          // Navigate to QR scanner instead of marking attendance directly
          console.log('Opening QR scanner for session:', sessionId);
          router.push('/qr-scanner');
          break;
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  // State for current checkout session
  const [currentCheckoutSession, setCurrentCheckoutSession] = useState<string | null>(null);

  // Run async checkout after confirmation
  React.useEffect(() => {
    const doCheckout = async () => {
      if (!pendingCheckout || !currentCheckoutSession || !user) return;
      
      try {
        console.log('Processing checkout for session:', currentCheckoutSession);
        await AttendanceService.recordCheckout(currentCheckoutSession, user.id);
        
        // Refresh attendance records to update UI
        await fetchAttendanceRecords();
        
        Toast.show({
          type: 'success',
          text1: 'Checked out successfully!',
          visibilityTime: 3000,
        });
      } catch (e) {
        let errorMsg = 'An error occurred while checking out.';
        if (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') {
          errorMsg = (e as any).message;
        }
        console.error('Checkout error:', e);
        Toast.show({
          type: 'error',
          text1: 'Checkout failed',
          text2: errorMsg,
          visibilityTime: 4000,
        });
      } finally {
        setPendingCheckout(false);
        setCurrentCheckoutSession(null);
      }
    };
    
    doCheckout();
  }, [pendingCheckout, currentCheckoutSession, user, fetchAttendanceRecords]);

  // Check if attendance is marked for a session
  const isAttendanceMarked = (sessionId: string) => {
    return attendanceRecords.some(record => record.session_id === sessionId);
  };

  // Check if checkout is marked for a session
  const isCheckoutMarked = (sessionId: string) => {
    const record = attendanceRecords.find(record => record.session_id === sessionId);
    return record?.check_out_time ? true : false;
  };

  // Get attendance record for a session
  const getAttendanceRecord = (sessionId: string) => {
    return attendanceRecords.find(record => record.session_id === sessionId);
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
              const hasCheckedOut = isCheckoutMarked(session.id);
              
              return (
                <View key={session.id} style={[styles.classCard, { backgroundColor: colors.card }]}>
                  {/* Course Header */}
                  <View style={styles.classHeader}>
                    <View style={styles.classInfo}>
                      <Text style={[styles.classTitle, { color: colors.text }]}>
                        {session.course?.name || 'Unknown Course'}
                      </Text>
                      {/* Attendance Status Indicator */}
                      {isMarked && (
                        <View style={[styles.attendanceStatus, { backgroundColor: colors.success }]}>
                          <Text style={styles.attendanceStatusText}>✓ Present</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.classHeaderRight}>
                      <View style={[styles.classCode, { backgroundColor: colors.primary }]}>
                        <Text style={styles.classCodeText}>
                          {session.course?.code || 'N/A'}
                        </Text>
                      </View>
                      <Ionicons 
                        name="chevron-up" 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </View>
                  </View>
                  
                  {/* Session Details */}
                  <View style={styles.classDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {formatSessionTime(session.startTime, session.endTime)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {session.location || 'Location TBD'}
                      </Text>
                    </View>
                    
                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    {/* Lecturer and Day */}
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        Lecturer: {session.course?.instructor?.name || 'TBD'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        Day: {new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long' })}
                      </Text>
                    </View>
                    
                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          { 
                            borderColor: colors.border,
                            opacity: isMarked ? 0.5 : 1
                          }
                        ]}
                        onPress={() => handleMarkAttendance(session.id, 'checkIn')}
                        disabled={isLoading || isMarked}
                      >
                        <Text style={[
                          styles.actionButtonText, 
                          { 
                            color: isMarked ? colors.textSecondary : colors.text 
                          }
                        ]}>
                          {isMarked ? 'Checked In' : 'Check In'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          { 
                            borderColor: colors.border,
                            opacity: hasCheckedOut ? 0.5 : 1
                          }
                        ]}
                        onPress={() => handleMarkAttendance(session.id, 'checkOut')}
                        disabled={isLoading || !isMarked || hasCheckedOut}
                      >
                        <Text style={[
                          styles.actionButtonText, 
                          { 
                            color: hasCheckedOut ? colors.textSecondary : (!isMarked ? colors.textSecondary : colors.text)
                          }
                        ]}>
                          {hasCheckedOut ? 'Checked Out' : 'Check Out'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton, 
                          { 
                            borderColor: colors.border,
                            opacity: isMarked ? 0.5 : 1
                          }
                        ]}
                        onPress={() => handleMarkAttendance(session.id, 'scanQR')}
                        disabled={isLoading || isMarked}
                      >
                        <MaterialCommunityIcons 
                          name="qrcode-scan" 
                          size={16} 
                          color={isMarked ? colors.textSecondary : colors.text} 
                        />
                        <Text style={[
                          styles.actionButtonText, 
                          { 
                            color: isMarked ? colors.textSecondary : colors.text 
                          }
                        ]}>
                          Scan QR
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Toast notifications */}
      <Toast />
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
  divider: {
    height: 1,
    marginVertical: 8,
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
  attendanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 