import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CourseService, Enrollment } from '@/services/courseService';
import { supabase } from '@/lib/supabase';

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  console.log('CoursesScreen user:', user);

  useEffect(() => {
    async function fetchCoursesAndEnrollments() {
      setLoading(true);
      try {
        // Fetch all courses
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select(`*, instructor:users!courses_instructor_id_fkey(full_name, email)`);
        if (coursesError) throw coursesError;

        // Fetch student's enrollments
        let enrolledIds: Set<string> = new Set();
        if (user?.id) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('student_course_enrollments')
            .select('course_id, status')
            .eq('student_id', user.id)
            .eq('status', 'active');
          if (enrollmentsError) throw enrollmentsError;
          enrolledIds = new Set(enrollments.map(e => e.course_id));
        }

        // Merge: add isEnrolled to each course
        const merged = courses.map(course => ({
          ...course,
          isEnrolled: enrolledIds.has(course.id),
        }));
        setAllCourses(merged);
      } catch (err) {
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCoursesAndEnrollments();
  }, [user?.id]);

  const enrollInCourse = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await CourseService.enrollInCourse(courseId);
      // Refresh all courses
      if (user?.id) {
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select(`*, instructor:users!courses_instructor_id_fkey(full_name, email)`);
        if (coursesError) throw coursesError;
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('student_course_enrollments')
          .select('course_id, status')
          .eq('student_id', user.id)
          .eq('status', 'active');
        if (enrollmentsError) throw enrollmentsError;
        const enrolledIds = new Set(enrollments.map(e => e.course_id));
        const merged = courses.map(course => ({
          ...course,
          isEnrolled: enrolledIds.has(course.id),
        }));
        setAllCourses(merged);
      }
    } catch (e) {
      alert('Failed to enroll in course.');
    } finally {
      setEnrolling(null);
    }
  };

  console.log('CoursesScreen: Rendering with user:', user?.id);

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
    console.log('CoursesScreen: useEffect triggered');
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
            onPress={() => router.push('/(tabs)/settings')}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* All Courses Section */}
        <View style={[styles.coursesCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              All Courses
            </Text>
          </View>
          {loading ? (
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          ) : allCourses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No courses found.</Text>
          ) : (
            allCourses.map(course => (
              <View key={course.id} style={{ marginBottom: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>{course.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{course.code} • {course.instructor?.full_name || 'Unknown Instructor'}</Text>
                {course.isEnrolled ? (
                  <Text style={{ color: colors.success, marginTop: 4 }}>Enrolled</Text>
                ) : (
                  <TouchableOpacity
                    style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => enrollInCourse(course.id)}
                    disabled={enrolling === course.id}
                  >
                    <Text style={{ color: '#FFF' }}>{enrolling === course.id ? 'Enrolling...' : 'Enroll'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
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
  coursesCard: {
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
  coursesMessage: {
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
  testCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  testText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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