import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [activeTab, setActiveTab] = useState<'overview' | 'courseDetails'>('overview');

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

  useEffect(() => {
    console.log('HistoryScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('HistoryScreen: Fetching attendance records for user:', user.id);
      fetchAttendanceRecords();
    }
  }, [user, fetchAttendanceRecords]);

  const getPerformanceCategory = (percentage: number) => {
    if (percentage >= 90) return { label: 'excellent', color: colors.success };
    if (percentage >= 75) return { label: 'good', color: colors.warning };
    return { label: 'at risk', color: colors.error };
  };

  const getOverallAttendance = () => {
    return 80; // Mock overall attendance percentage
  };

  // Mock course data
  const courseData = [
    {
      id: 1,
      name: "Data Structures & Algorithms",
      code: "CS 201",
      attendance: 22,
      total: 24,
      percentage: 92,
    },
    {
      id: 2,
      name: "Database Systems",
      code: "CS 301",
      attendance: 16,
      total: 20,
      percentage: 80,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTitle, { color: colors.primary }]}>Tcheck</Text>
              <Text style={[styles.logoSubtitle, { color: colors.textSecondary }]}>Student Attendance</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

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
        {activeTab === 'overview' ? (
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
            {courseData.map((course) => {
              const performance = getPerformanceCategory(course.percentage);
              return (
                <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.name}
                    </Text>
                    <View style={[styles.performanceBadge, { backgroundColor: colors.highlight }]}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
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
                          backgroundColor: colors.primary,
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
            {courseData.map((course) => (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
                <View style={styles.courseHeader}>
                  <Text style={[styles.courseTitle, { color: colors.text }]}>
                    {course.name}
                  </Text>
                  <View style={[styles.performanceBadge, { backgroundColor: colors.highlight }]}>
                    <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {course.percentage}% • {getPerformanceCategory(course.percentage).label}
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
                  
                  <View style={styles.recentClassItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.recentClassName, { color: colors.text }]}>
                      Binary Trees
                    </Text>
                    <Text style={[styles.recentClassDate, { color: colors.textSecondary }]}>
                      2024-01-15
                    </Text>
                  </View>
                  
                  <View style={styles.recentClassItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.recentClassName, { color: colors.text }]}>
                      Linked Lists
                    </Text>
                    <Text style={[styles.recentClassDate, { color: colors.textSecondary }]}>
                      2024-01-12
                    </Text>
                  </View>
                  
                  <View style={styles.recentClassItem}>
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                    <Text style={[styles.recentClassName, { color: colors.text }]}>
                      Arrays & Strings
                    </Text>
                    <Text style={[styles.recentClassDate, { color: colors.textSecondary }]}>
                      2024-01-10
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
});