import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLEService } from '@/services/bleService';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

interface EnrollmentStatusProps {
  onRefresh?: () => void;
}

export function EnrollmentStatus({ onRefresh }: EnrollmentStatusProps) {
  const { user } = useAuthStore();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollmentData();
  }, [user]);

  const loadEnrollmentData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get enrolled courses
      const enrolledCourseIds = await BLEService.getEnrolledCourses(user.id);
      
      if (enrolledCourseIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .in('id', enrolledCourseIds);

        setEnrolledCourses(courses || []);
      } else {
        setEnrolledCourses([]);
      }

      // Get active sessions for enrolled courses
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];

      const { data: sessions } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .in('course_id', enrolledCourseIds)
        .gte('start_time', currentTime)
        .lte('end_time', currentTime);

      setActiveSessions(sessions || []);
    } catch (error) {
      console.error('Error loading enrollment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceWindowStatus = async (sessionId: string) => {
    try {
      return await BLEService.checkAttendanceWindow(sessionId);
    } catch (error) {
      console.error('Error checking attendance window:', error);
      return { isOpen: false, message: 'Error checking window' };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading enrollment status...</Text>
      </View>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Ionicons name="alert-circle" size={24} color={colors.warning} />
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>No Enrolled Courses</Text>
            <Text style={styles.statusDescription}>
              You are not enrolled in any courses. Contact your administrator to enroll in courses.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enrollment Status</Text>
        <TouchableOpacity onPress={loadEnrollmentData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.enrollmentCard}>
        <Text style={styles.sectionTitle}>Enrolled Courses ({enrolledCourses.length})</Text>
        {enrolledCourses.map((course) => (
          <View key={course.id} style={styles.courseItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseCode}>({course.code})</Text>
          </View>
        ))}
      </View>

      {activeSessions.length > 0 && (
        <View style={styles.sessionsCard}>
          <Text style={styles.sectionTitle}>Active Sessions ({activeSessions.length})</Text>
          {activeSessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionCourse}>{session.course?.name}</Text>
                <Text style={styles.sessionTime}>
                  {session.start_time} - {session.end_time}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.windowButton}
                onPress={async () => {
                  const windowStatus = await getAttendanceWindowStatus(session.id);
                  // You could show this in an alert or modal
                  console.log('Window status:', windowStatus);
                }}
              >
                <Text style={styles.windowButtonText}>Check Window</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {activeSessions.length === 0 && enrolledCourses.length > 0 && (
        <View style={styles.noSessionsCard}>
          <Ionicons name="time" size={24} color={colors.textSecondary} />
          <Text style={styles.noSessionsText}>No active sessions at this time</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  refreshButton: {
    padding: 5,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 8,
    gap: 10,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  enrollmentCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  courseName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionsCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionCourse: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  windowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  windowButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  noSessionsCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  noSessionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
}); 