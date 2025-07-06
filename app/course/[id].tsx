import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { CourseService } from '@/services/courseService';
import HistoryItem from '@/components/HistoryItem';
import AttendanceStats from '@/components/AttendanceStats';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/ui/Button';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, getCourseAttendance } = useAttendanceStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [enrollmentStatus, setEnrollmentStatus] = useState<'enrolled' | 'pending' | 'not_enrolled'>('not_enrolled');
  const [loading, setLoading] = useState(false);
  
  // Find the course by ID
  const course = courses.find(c => c.id === id);
  
  // Get attendance records for this course
  const attendanceRecords = getCourseAttendance(id || '');
  
  // Calculate attendance statistics
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'verified').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  useEffect(() => {
    if (user && id) {
      checkEnrollmentStatus();
    }
  }, [user, id]);

  const checkEnrollmentStatus = async () => {
    if (!user || !id) return;
    
    try {
      const status = await CourseService.getEnrollmentStatus(user.id, id);
      setEnrollmentStatus(status);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  };

  const handleEnrollInCourse = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      await CourseService.enrollStudentInCourse(user.id, id);
      Alert.alert('Success', 'You have been enrolled in this course successfully!');
      await checkEnrollmentStatus();
    } catch (error) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    router.push('/qr-scanner');
  };

  const handleViewHistory = () => {
    router.push('/(tabs)/history');
  };
  
  if (!course) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={<MaterialCommunityIcons name="book-open" size={32} color={colors.primary} />}
          title="Course Not Found"
          message="The course you're looking for doesn't exist or has been removed."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: course.code,
          headerBackTitle: "Back",
        }}
      />
      
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card gradient elevated style={styles.courseHeader}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>
            {course.name}
          </Text>
          <Text style={[styles.courseCode, { color: colors.primary }]}>
            {course.code}
          </Text>
          
          {/* Enrollment Status Badge */}
          <View style={[styles.enrollmentBadge, { 
            backgroundColor: enrollmentStatus === 'enrolled' ? colors.success : 
                          enrollmentStatus === 'pending' ? colors.warning : colors.error 
          }]}>
            <Text style={[styles.enrollmentText, { color: 'white' }]}>
              {enrollmentStatus === 'enrolled' ? 'Enrolled' : 
               enrollmentStatus === 'pending' ? 'Pending' : 'Not Enrolled'}
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        {enrollmentStatus === 'enrolled' && (
          <Card elevated style={styles.actionsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleScanQR}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
                <Text style={styles.actionText}>Scan QR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={handleViewHistory}
              >
                <MaterialCommunityIcons name="history" size={24} color="white" />
                <Text style={styles.actionText}>History</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Enrollment Action */}
        {enrollmentStatus === 'not_enrolled' && (
          <Card elevated style={styles.enrollmentCard}>
            <Text style={[styles.enrollmentTitle, { color: colors.text }]}>
              Enroll in this Course
            </Text>
            <Text style={[styles.enrollmentDescription, { color: colors.textSecondary }]}>
              Join this course to start tracking your attendance and accessing course materials.
            </Text>
            <Button
              title={loading ? "Enrolling..." : "Enroll Now"}
              onPress={handleEnrollInCourse}
              disabled={loading}
              style={styles.enrollButton}
            />
          </Card>
        )}
        
        <Card elevated style={styles.courseDetails}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Instructor
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course.instructorName || 'Unknown Instructor'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialCommunityIcons name="clock" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Schedule
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course.schedule || 'Schedule TBD'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Location
              </Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course.room || 'Location TBD'}
              </Text>
            </View>
          </View>
          
          {course.days && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Days
                </Text>
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {course.days.join(', ')}
                </Text>
              </View>
            </View>
          )}
        </Card>
        
        {enrollmentStatus === 'enrolled' && (
          <>
            <AttendanceStats
              totalClasses={totalClasses}
              presentCount={presentCount}
              lateCount={lateCount}
              absentCount={absentCount}
            />
            
            <View style={styles.attendanceSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Attendance History
              </Text>
              
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map(record => (
                  <HistoryItem key={record.id} record={record} />
                ))
              ) : (
                <Card elevated style={styles.emptyCard}>
                  <EmptyState
                    icon={<MaterialCommunityIcons name="clock" size={32} color={colors.primary} />}
                    title="No Records Yet"
                    message="Your attendance will be recorded when you attend this class"
                    actionLabel="View All Courses"
                    onAction={() => router.push('/(tabs)/courses')}
                  />
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  courseHeader: {
    padding: 24,
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  courseDetails: {
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendanceSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  enrollmentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  enrollmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsCard: {
    padding: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  enrollmentCard: {
    padding: 20,
    marginBottom: 20,
  },
  enrollmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  enrollmentDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  enrollButton: {
    paddingVertical: 12,
    borderRadius: 12,
  },
});