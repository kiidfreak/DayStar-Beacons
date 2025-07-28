import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { AttendanceService } from '@/services/attendanceService';
import { ClassSession } from '@/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('CoursesScreen: Rendering with user:', user?.id);

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

  // Fetch course timetable data
  const fetchTimetableData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get sessions for the next 7 days
      const today = new Date();
      const sessionsPromises = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        sessionsPromises.push(AttendanceService.getSessionsForDate(user.id, date));
      }
      
      const sessionsArrays = await Promise.all(sessionsPromises);
      
      // Group sessions by day
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetable = dayNames.map((dayName, index) => {
        const daySessions = sessionsArrays[index] || [];
        return {
          day: dayName,
          classes: daySessions.map((session: ClassSession) => ({
            id: session.id,
            title: session.course?.name || 'Unknown Course',
            code: session.course?.code || 'N/A',
            time: formatSessionTime(session.startTime, session.endTime),
            location: session.location || 'Location TBD',
            instructor: session.course?.instructor?.name || 'TBD',
            sessionDate: session.sessionDate,
            startTime: session.startTime,
            endTime: session.endTime,
          }))
        };
      });
      
      setTimetableData(timetable);
    } catch (error) {
      console.error('Error fetching timetable data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CoursesScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('CoursesScreen: Fetching timetable data for user:', user.id);
      fetchTimetableData();
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

  // Format session time range
  const formatSessionTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'TBD';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startFormatted = start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const endFormatted = end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${startFormatted} - ${endFormatted}`;
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
            My Timetable
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getCurrentDate()}
          </Text>
        </Animated.View>

        {/* Timetable Cards */}
        <Animated.View 
          style={[
            styles.timetableContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {loading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading timetable...
              </Text>
            </View>
          ) : timetableData.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No timetable data available
              </Text>
            </View>
          ) : (
            timetableData.map((dayData, index) => (
              <View key={index} style={[styles.dayCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.dayTitle, { color: colors.primary }]}>
                  {dayData.day}
                </Text>
                
                {dayData.classes.length === 0 ? (
                  <Text style={[styles.noClassesText, { color: colors.textSecondary }]}>
                    No classes scheduled
                  </Text>
                ) : (
                  dayData.classes.map((classItem: any, classIndex: number) => (
                    <View key={classItem.id || classIndex} style={styles.classItem}>
                      <View style={styles.classHeader}>
                        <Text style={[styles.classTitle, { color: colors.text }]}>
                          {classItem.title}
                        </Text>
                        <Text style={[styles.classTime, { color: colors.textSecondary }]}>
                          {classItem.time}
                        </Text>
                      </View>
                      
                      <View style={styles.classDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {classItem.location}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {classItem.instructor}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {new Date(classItem.sessionDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      {classIndex < dayData.classes.length - 1 && (
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  ))
                )}
              </View>
            ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
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
  timetableContainer: {
    gap: 16,
  },
  dayCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  noClassesText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  classItem: {
    marginBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  classTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  classDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginTop: 16,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
}); 