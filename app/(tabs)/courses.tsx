import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  description: string;
  credits: number;
  enrollment: number;
  rating: number;
  isEnrolled: boolean;
}

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [activeTab, setActiveTab] = useState<'myCourses' | 'available'>('myCourses');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

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

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'Advanced Web Development',
        code: 'CS 401',
        instructor: 'Dr. Smith',
        description: 'Learn modern web development with React, Node.js, and databases.',
        credits: 3,
        enrollment: 85,
        rating: 4.5,
        isEnrolled: true,
      },
      {
        id: '2',
        title: 'Mobile App Development',
        code: 'CS 402',
        instructor: 'Prof. Johnson',
        description: 'Build native mobile applications using React Native and Expo.',
        credits: 4,
        enrollment: 72,
        rating: 4.2,
        isEnrolled: false,
      },
      {
        id: '3',
        title: 'Database Systems',
        code: 'CS 301',
        instructor: 'Dr. Williams',
        description: 'Advanced database design, implementation, and management.',
        credits: 3,
        enrollment: 95,
        rating: 4.7,
        isEnrolled: false,
      },
    ];
    
    setCourses(mockCourses);
  }, []);

  // Filter courses based on active tab and search query
  useEffect(() => {
    let filtered = courses.filter(course => {
      const matchesTab = activeTab === 'myCourses' ? course.isEnrolled : !course.isEnrolled;
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
    
    setFilteredCourses(filtered);
  }, [courses, activeTab, searchQuery]);

  const handleEnrollToggle = (courseId: string) => {
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, isEnrolled: !course.isEnrolled }
          : course
      )
    );
  };

  const getMyCoursesCount = () => courses.filter(course => course.isEnrolled).length;
  const getAvailableCount = () => courses.filter(course => !course.isEnrolled).length;

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
          <Text style={[styles.title, { color: colors.text }]}>
            Courses
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Browse and manage your courses
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search courses..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Tab Navigation */}
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
              activeTab === 'myCourses' && { backgroundColor: colors.card }
            ]}
            onPress={() => setActiveTab('myCourses')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'myCourses' ? colors.text : colors.textSecondary }
            ]}>
              My Courses ({getMyCoursesCount()})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'available' && { backgroundColor: colors.card }
            ]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'available' ? colors.text : colors.textSecondary }
            ]}>
              Available ({getAvailableCount()})
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Course Cards */}
        <Animated.View 
          style={[
            styles.coursesContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {filteredCourses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No courses found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {activeTab === 'myCourses' 
                  ? 'You haven\'t enrolled in any courses yet.'
                  : 'No available courses match your search.'
                }
              </Text>
            </View>
          ) : (
            filteredCourses.map((course) => (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card }]}>
                {/* Course Header */}
                <View style={styles.courseHeader}>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                      {course.code} • {course.instructor}
                    </Text>
                  </View>
                  <View style={[styles.creditsBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.creditsNumber}>{course.credits}</Text>
                    <Text style={styles.creditsLabel}>Credits</Text>
                  </View>
                </View>

                {/* Course Description */}
                <Text style={[styles.courseDescription, { color: colors.textSecondary }]}>
                  {course.description}
                </Text>

                {/* Course Stats and Action */}
                <View style={styles.courseFooter}>
                  <View style={styles.courseStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="account-group" size={16} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {course.enrollment}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {course.rating}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.actionButton, 
                      { 
                        backgroundColor: course.isEnrolled ? colors.error : colors.card,
                        borderColor: course.isEnrolled ? colors.error : colors.border
                      }
                    ]}
                    onPress={() => handleEnrollToggle(course.id)}
                  >
                    <Text style={[
                      styles.actionButtonText, 
                      { color: course.isEnrolled ? '#FFFFFF' : colors.text }
                    ]}>
                      {course.isEnrolled ? 'Unenroll' : 'Enroll'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  coursesContainer: {
    gap: 16,
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
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
    marginRight: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 14,
    fontWeight: '500',
  },
  creditsBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  creditsNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  creditsLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 