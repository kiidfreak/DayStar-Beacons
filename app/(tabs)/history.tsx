import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { AttendanceService } from '@/services/attendanceService';
import { AttendanceRecord } from '@/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords, attendanceRecords } = useAttendanceStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [activeTab, setActiveTab] = useState<'overview' | 'courseDetails'>('overview');
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    attendanceRate: 0,
    pendingVerifications: 0
  });
  const [loading, setLoading] = useState(false);

  console.log('HistoryScreen: Rendering with user:', user?.id);

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

  // Fetch attendance statistics
  const fetchAttendanceStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const stats = await AttendanceService.getStudentAttendanceStats(user.id);
      setOverallStats({...stats, attendanceRate: Math.round(stats.attendanceRate)});
      
      // Calculate course-specific stats from attendance records
      const courseMap = new Map();
      
      attendanceRecords.forEach(record => {
        const courseKey = `${record.course_code}-${record.course_name}`;
        if (!courseMap.has(courseKey)) {
          courseMap.set(courseKey, {
            id: courseKey,
            name: record.course_name || 'Unknown Course',
            code: record.course_code || 'N/A',
            attendance: 0,
            total: 0,
            percentage: 0,
            records: []
          });
        }
        
        const course = courseMap.get(courseKey);
        course.records.push(record);
        course.total++;
        
        if (record.status === 'present') {
          course.attendance++;
        }
      });
      
      // Calculate percentages
      const courseStatsArray = Array.from(courseMap.values()).map(course => ({
        ...course,
        percentage: course.total > 0 ? Math.round((course.attendance / course.total) * 100) : 0
      }));
      
      setCourseStats(courseStatsArray);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('HistoryScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('HistoryScreen: Fetching attendance records for user:', user.id);
      fetchAttendanceRecords();
    }
  }, [user, fetchAttendanceRecords]);

  // Fetch stats when attendance records change
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      fetchAttendanceStats();
    }
  }, [attendanceRecords]);

  const getPerformanceCategory = (percentage: number) => {
    if (percentage >= 90) return { label: 'excellent', color: colors.success };
    if (percentage >= 75) return { label: 'good', color: colors.warning };
    return { label: 'at risk', color: colors.error };
  };

  const getOverallAttendance = () => {
    return overallStats.attendanceRate;
  };

  // Get recent attendance records for a course
  const getRecentAttendanceForCourse = (courseCode: string, limit: number = 5) => {
    return attendanceRecords
      .filter(record => record.course_code === courseCode)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
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
            Attendance History
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your class attendance performance
          </Text>
        </Animated.View>

        {/* Navigation Tabs */}
        <Animated.View 
          style={[
            styles.tabsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'overview' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'overview' ? '#FFFFFF' : colors.text }
            ]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'courseDetails' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('courseDetails')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'courseDetails' ? '#FFFFFF' : colors.text }
            ]}>
              Course Details
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Content based on active tab */}
        {loading ? (
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading attendance history...
              </Text>
            </View>
          </Animated.View>
        ) : activeTab === 'overview' ? (
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Overall Performance Card */}
            <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Overall Performance
                </Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Your attendance across all enrolled courses
              </Text>
              
              <View style={styles.attendanceDisplay}>
                <Text style={[styles.attendanceLabel, { color: colors.text }]}>
                  Overall Attendance
                </Text>
                <Text style={[styles.attendancePercentage, { color: colors.primary }]}>
                  {getOverallAttendance()}%
                </Text>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${getOverallAttendance()}%`
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {overallStats.attendedSessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Classes Attended
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {overallStats.totalSessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Total Classes
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {overallStats.pendingVerifications}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Pending
                  </Text>
                </View>
              </View>
              
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.success }]}>
                    Excellent: 90%+ attendance
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.legendText, { color: colors.warning }]}>
                    Good: 75-89% attendance
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={[styles.legendText, { color: colors.error }]}>
                    At Risk: Below 75%
                  </Text>
                </View>
              </View>
            </View>

            {/* Course Performance Cards */}
            {courseStats.map((course) => {
              const performance = getPerformanceCategory(course.percentage);
              return (
                <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.name}
                    </Text>
                    <View style={[styles.performanceBadge, { backgroundColor: colors.highlight }]}>
                      <View style={[styles.badgeDot, { backgroundColor: performance.color }]} />
                      <Text style={[styles.badgeText, { color: performance.color }]}>
                        {course.percentage}% • {performance.label}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                    {course.code}
                  </Text>
                  
                  <View style={styles.courseStats}>
                    <Text style={[styles.courseStatsText, { color: colors.textSecondary }]}>
                      {course.attendance}/{course.total} classes attended
                    </Text>
                    <Text style={[styles.coursePercentage, { color: colors.text }]}>
                      {course.percentage}%
                    </Text>
                  </View>
                  
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: performance.color,
                          width: `${course.percentage}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Course Details Content */}
            {courseStats.map((course) => {
              const performance = getPerformanceCategory(course.percentage);
              const recentAttendance = getRecentAttendanceForCourse(course.code);
              
              return (
                <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.name}
                    </Text>
                    <View style={[styles.performanceBadge, { backgroundColor: colors.highlight }]}>
                      <View style={[styles.badgeDot, { backgroundColor: performance.color }]} />
                      <Text style={[styles.badgeText, { color: performance.color }]}>
                        {course.percentage}% • {performance.label}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                    {course.code}
                  </Text>
                  
                  <View style={styles.courseStats}>
                    <Text style={[styles.courseStatsText, { color: colors.textSecondary }]}>
                      {course.attendance} Attended
                    </Text>
                    <Text style={[styles.courseStatsText, { color: colors.textSecondary }]}>
                      {course.total - course.attendance} Missed
                    </Text>
                  </View>
                  
                  <View style={styles.recentClasses}>
                    <View style={styles.recentHeader}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.recentTitle, { color: colors.text }]}>
                        Recent Classes
                      </Text>
                    </View>
                    
                    {recentAttendance.length === 0 ? (
                      <Text style={[styles.noRecentText, { color: colors.textSecondary }]}>
                        No recent attendance records
                      </Text>
                    ) : (
                      recentAttendance.map((record, index) => (
                        <View key={index} style={styles.recentClassItem}>
                          <Ionicons 
                            name={record.status === 'present' ? "checkmark-circle" : "close-circle"} 
                            size={16} 
                            color={record.status === 'present' ? colors.success : colors.error} 
                          />
                          <Text style={[styles.recentClassName, { color: colors.text }]}>
                            {record.course_name || 'Class Session'}
                          </Text>
                          <Text style={[styles.recentClassDate, { color: colors.textSecondary }]}>
                            {formatDate(record.created_at)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}
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
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    gap: 16,
  },
  performanceCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  attendanceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendanceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendancePercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  courseCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseCode: {
    fontSize: 14,
    marginBottom: 12,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseStatsText: {
    fontSize: 14,
  },
  coursePercentage: {
    fontSize: 18,
    fontWeight: '600',
  },
  recentClasses: {
    marginTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentClassItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentClassName: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  recentClassDate: {
    fontSize: 12,
  },
  loadingContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  noRecentText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});