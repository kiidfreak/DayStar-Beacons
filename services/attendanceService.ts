import { supabase } from '@/lib/supabase';
import { AttendanceRecord, ClassSession, ApiResponse } from '@/types';

export class AttendanceService {
  /**
   * Record attendance for a class session
   */
  static async recordAttendance(
    sessionId: string,
    studentId: string,
    method: 'BLE' | 'QR' | 'manual',
    latitude?: number,
    longitude?: number,
    deviceInfo?: any
  ): Promise<ApiResponse<AttendanceRecord>> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          method,
          status: 'pending', // Will be verified by lecturer
          check_in_time: new Date().toISOString(),
          latitude,
          longitude,
          device_info: deviceInfo,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          session:class_sessions(
            *,
            course:courses(
              code,
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      // Transform database record to app format
      const transformedRecord: AttendanceRecord = {
        id: data.id,
        sessionId: data.session_id,
        studentId: data.student_id,
        method: data.method,
        status: data.status,
        checkInTime: data.check_in_time,
        latitude: data.latitude,
        longitude: data.longitude,
        locationAccuracy: data.location_accuracy,
        deviceInfo: data.device_info,
        verifiedBy: data.verified_by,
        verifiedAt: data.verified_at,
        courseName: data.session?.course?.name || 'Unknown Course',
        courseCode: data.session?.course?.code || 'UNKNOWN',
        date: data.session?.session_date || new Date().toISOString().split('T')[0],
        createdAt: data.created_at,
        session: data.session
      };

      return {
        data: transformedRecord,
        message: 'Attendance recorded successfully'
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance records for a student
   */
  static async getStudentAttendance(
    studentId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          session:class_sessions(
            *,
            course:courses(
              code,
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data?.map((record: any) => ({
        id: record.id,
        sessionId: record.session_id,
        studentId: record.student_id,
        method: record.method,
        status: record.status,
        checkInTime: record.check_in_time,
        latitude: record.latitude,
        longitude: record.longitude,
        locationAccuracy: record.location_accuracy,
        deviceInfo: record.device_info,
        verifiedBy: record.verified_by,
        verifiedAt: record.verified_at,
        courseName: record.session?.course?.name || 'Unknown Course',
        courseCode: record.session?.course?.code || 'UNKNOWN',
        date: record.session?.session_date || new Date().toISOString().split('T')[0],
        createdAt: record.created_at,
        session: record.session
      })) || [];
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  }

  /**
   * Get today's class sessions for a student's courses
   */
  static async getTodaysSessions(studentId: string): Promise<ClassSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First get the student's enrolled courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const courseIds = enrollments.map(e => e.course_id);

      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(
            *,
            instructor:users!courses_instructor_id_fkey(
              first_name,
              last_name,
              email
            ),
            beacon:ble_beacons(*)
          )
        `)
        .eq('session_date', today)
        .in('course_id', courseIds);

      if (error) throw error;

      return data?.map((session: any) => ({
        id: session.id,
        courseId: session.course_id,
        course: session.course,
        instructorId: session.instructor_id,
        sessionDate: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        sessionType: session.session_type,
        // Map database fields to mobile app expected fields
        qrCodeActive: session.qr_code_active,
        qrCodeExpiresAt: session.qr_code_expires_at,
        beaconEnabled: session.beacon_enabled,
        beaconId: session.beacon_id,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        createdAt: session.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
      throw error;
    }
  }

  /**
   * Check if attendance is currently open for a session
   */
  static async isAttendanceOpen(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('attendance_window_start, attendance_window_end, qr_code_active, beacon_enabled')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      // Check if QR code or beacon is active
      if (!data.qr_code_active && !data.beacon_enabled) return false;

      const now = new Date();
      const openTime = data.attendance_window_start ? new Date(data.attendance_window_start) : null;
      const closeTime = data.attendance_window_end ? new Date(data.attendance_window_end) : null;

      // If no time windows set, consider it open if QR/beacon is active
      if (!openTime && !closeTime) {
        return data.qr_code_active || data.beacon_enabled;
      }

      // Check if current time is within attendance window
      if (openTime && closeTime) {
        return now >= openTime && now <= closeTime;
      }

      if (openTime && !closeTime) {
        return now >= openTime;
      }

      if (!openTime && closeTime) {
        return now <= closeTime;
      }

      return false;
    } catch (error) {
      console.error('Error checking attendance status:', error);
      return false;
    }
  }

  /**
   * Get attendance statistics for a student
   */
  static async getStudentAttendanceStats(studentId: string): Promise<{
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    pendingVerifications: number;
  }> {
    try {
      // Get total enrolled courses
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'approved');

      if (enrollmentError) throw enrollmentError;

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) {
        return {
          totalSessions: 0,
          attendedSessions: 0,
          attendanceRate: 0,
          pendingVerifications: 0
        };
      }

      // Get total sessions for enrolled courses
      const { data: sessions, error: sessionError } = await supabase
        .from('class_sessions')
        .select('id')
        .in('course_id', courseIds)
        .lte('session_date', new Date().toISOString().split('T')[0]);

      if (sessionError) throw sessionError;

      const totalSessions = sessions?.length || 0;

      // Get attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId);

      if (attendanceError) throw attendanceError;

      const attendedSessions = attendance?.filter(a => 
        a.status === 'verified' || a.status === 'late'
      ).length || 0;

      const pendingVerifications = attendance?.filter(a => 
        a.status === 'pending'
      ).length || 0;

      const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      return {
        totalSessions,
        attendedSessions,
        attendanceRate,
        pendingVerifications
      };
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error;
    }
  }
} 