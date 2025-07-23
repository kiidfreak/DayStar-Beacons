import { supabase } from '@/lib/supabase';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAuthStore } from '@/store/authStore';
import { CourseService } from './courseService';
import { AttendanceService } from './attendanceService';

export class RealtimeService {
  private static subscriptions: Map<string, any> = new Map();

  /**
   * Start real-time subscriptions for a student
   */
  static async startRealtimeSubscriptions(userId: string) {

    
    // Subscribe to course enrollments changes
    this.subscribeToCourseEnrollments(userId);
    
    // Subscribe to class sessions changes
    this.subscribeToClassSessions(userId);
    
    // Subscribe to attendance records changes
    this.subscribeToAttendanceRecords(userId);
    
    // Subscribe to beacon changes
    this.subscribeToBeaconChanges();
    

  }

  /**
   * Subscribe to course enrollment changes
   */
  private static subscribeToCourseEnrollments(userId: string) {
    const subscription = supabase
      .channel('course-enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_course_enrollments',
          filter: `student_id=eq.${userId}`
        },
        async (payload) => {

          
          // Refresh courses when enrollment changes
          try {
            const courses = await CourseService.getStudentCourses(userId);
            useAttendanceStore.getState().setCourses(courses);

          } catch (error) {
            console.error('❌ Error refreshing courses:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('course-enrollments', subscription);
  }

  /**
   * Subscribe to class sessions changes
   */
  private static subscribeToClassSessions(userId: string) {
    const subscription = supabase
      .channel('class-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions'
        },
        async (payload) => {

          
          // Refresh today's sessions when sessions change
          try {
            const sessions = await AttendanceService.getTodaysSessions(userId);
            // Update the store with new sessions

          } catch (error) {
            console.error('❌ Error refreshing sessions:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('class-sessions', subscription);
  }

  /**
   * Subscribe to attendance records changes
   */
  private static subscribeToAttendanceRecords(userId: string) {
    const subscription = supabase
      .channel('attendance-records')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `student_id=eq.${userId}`
        },
        async (payload) => {

          
          // Refresh attendance records when they change
          try {
            const attendanceRecords = await AttendanceService.getStudentAttendance(userId);
            useAttendanceStore.getState().setAttendanceRecords(attendanceRecords);
          } catch (error) {
            console.error('❌ Error refreshing attendance records:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('attendance-records', subscription);
  }

  /**
   * Subscribe to beacon changes
   */
  private static subscribeToBeaconChanges() {
    const subscription = supabase
      .channel('ble-beacons')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ble_beacons'
        },
        (payload) => {
          // Beacon changes might affect current course detection
          // The beacon hook will handle this automatically
        }
      )
      .subscribe();

    this.subscriptions.set('ble-beacons', subscription);
  }

  /**
   * Stop all real-time subscriptions
   */
  static stopAllSubscriptions() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
    });
    
    this.subscriptions.clear();
  }

  /**
   * Get subscription status
   */
  static getSubscriptionStatus() {
    return {
      active: this.subscriptions.size > 0,
      count: this.subscriptions.size,
      channels: Array.from(this.subscriptions.keys())
    };
  }
} 