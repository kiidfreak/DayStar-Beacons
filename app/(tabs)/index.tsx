import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBeacon } from '@/hooks/useBeacon';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import BeaconStatus from '@/components/BeaconStatus';
import ClassCard from '@/components/ClassCard';
import RandomCheckPrompt from '@/components/RandomCheckPrompt';
import NotificationBell from '@/components/NotificationBell';
import AttendanceStats from '@/components/AttendanceStats';
import EmptyState from '@/components/EmptyState';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  // Prevent BLE scanning and student logic for admin
  if (user?.role !== 'student') {
    return null;
  }
  const { currentCourse, currentBeaconStatus, getTodayCourses, attendanceRecords, fetchAttendanceRecords } = useAttendanceStore();
  const { isScanning, startScanning, stopScanning, beaconErrorReason } = useBeacon();
  
  // Get today's classes
  const todayCourses = getTodayCourses();
  
  // Debug logs
  console.log('todayCourses:', todayCourses);
  console.log('currentCourse (nearby/active class):', currentCourse);
  
  // Calculate attendance stats
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'verified').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  
  // Start scanning when component mounts
  useEffect(() => {
    if (Platform.OS !== 'web') {
      startScanning();
    }
    
    return () => {
      if (Platform.OS !== 'web') {
        stopScanning();
      }
    };
  }, []);
  
  // Fetch attendance records when user logs in or changes
  useEffect(() => {
    if (user && typeof user.id === 'string' && user.id.length > 0) {
      console.log('Fetching attendance for user:', user.id);
      fetchAttendanceRecords(user.id);
    }
  }, [user?.id, fetchAttendanceRecords]);
  
  // Get today's date in a readable format
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  // Navigate to course details
  const handleCoursePress = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };
  
  // Safely create styles for web compatibility
  const qrButtonStyle = StyleSheet.flatten([
    styles.qrButton, 
    { backgroundColor: colors.card, borderColor: colors.border }
  ]);
  
  const activePillStyle = StyleSheet.flatten([
    styles.activePill, 
    { backgroundColor: `${colors.success}20` }
  ]);
  
  const activeDotStyle = StyleSheet.flatten([
    styles.activeDot, 
    { backgroundColor: colors.success }
  ]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar 
              name={user?.name || 'Student'} 
              size="medium"
            />
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                Hello, {user?.name?.split(' ')[0] || 'Student'}
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {today}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <NotificationBell />
            
            <Link href="/qr-scanner" asChild>
              <TouchableOpacity style={qrButtonStyle}>
                <MaterialCommunityIcons name="qrcode" size={20} color={colors.primary} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        
        <BeaconStatus beaconErrorReason={beaconErrorReason} />
        
        <AttendanceStats 
          totalClasses={totalClasses}
          presentCount={presentCount}
          lateCount={lateCount}
          absentCount={absentCount}
        />
        
        {currentBeaconStatus === 'connected' && currentCourse ? (
          <View style={styles.currentClassContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Current Class
              </Text>
              <View style={activePillStyle}>
                <View style={activeDotStyle} />
                <Text style={[styles.activeText, { color: colors.success }]}>
                  In Progress
                </Text>
              </View>
            </View>
            
            <ClassCard 
              course={currentCourse} 
              isActive={true} 
              onPress={() => handleCoursePress(currentCourse.id)}
            />
          </View>
        ) : (
          <Card gradient elevated style={styles.noClassCard}>
            <MaterialCommunityIcons name="clock" size={32} color={colors.primary} />
            <Text style={[styles.noClassTitle, { color: colors.text }]}>
              {currentBeaconStatus === 'scanning' 
                ? 'Searching for nearby classes...' 
                : 'No active class right now'}
            </Text>
            <Text style={[styles.noClassText, { color: colors.textSecondary }]}>
              {currentBeaconStatus === 'scanning' 
                ? 'Please make sure you are in the classroom' 
                : 'Check your schedule for upcoming classes'}
            </Text>
          </Card>
        )}
        
        <View style={styles.upcomingContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today's Classes
            </Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/calendar')}
            >
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
          
          {todayCourses.length > 0 ? (
            todayCourses.map(course => (
              <ClassCard 
                key={course.id} 
                course={course} 
                isActive={currentCourse?.id === course.id}
                onPress={() => handleCoursePress(course.id)}
              />
            ))
          ) : (
            <Card elevated style={styles.emptyCard}>
              <EmptyState
                icon={<MaterialCommunityIcons name="book-open" size={32} color={colors.primary} />}
                title="No Classes Today"
                message="Enjoy your free day! Check your schedule for upcoming classes."
                actionLabel="View All Courses"
                onAction={() => router.push('/courses')}
              />
            </Card>
          )}
        </View>
      </ScrollView>
      
      <RandomCheckPrompt />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  currentClassContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noClassCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  noClassTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noClassText: {
    fontSize: 14,
    textAlign: 'center',
  },
  upcomingContainer: {
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 0,
    overflow: 'hidden',
  },
});