import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import HistoryItem from '@/components/HistoryItem';
import AttendanceStats from '@/components/AttendanceStats';
import EmptyState from '@/components/EmptyState';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, getCourseAttendance } = useAttendanceStore();
  const { colors } = useTheme();
  
  // Find the course by ID
  const course = courses.find(c => c.id === id);
  
  // Get attendance records for this course
  const attendanceRecords = getCourseAttendance(id || '');
  
  // Calculate attendance statistics
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'verified').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  
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
        </Card>
        
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
                {course.instructor? course.instructor.name: 'Unknown'}
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
                {course.schedule}
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
                {course.room}
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
                onAction={() => router.push('/courses')}
              />
            </Card>
          )}
        </View>
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
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendanceSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 0,
    overflow: 'hidden',
  },
});