import { supabase } from '@/lib/supabase';
import { AttendanceRecord, ClassSession, ApiResponse } from '@/types';
import { BLEService } from './bleService';
import { DeviceBindingService } from './deviceBindingService';

export class AttendanceService {
  /**
   * Record attendance with device binding verification
   */
  static async recordAttendance(
    sessionId: string,
    studentId: string,
    method: 'ble' | 'qr-code' | 'manual' | 'gps' | 'nfc',
    latitude?: number,
    longitude?: number,
    deviceInfo?: any
  ): Promise<ApiResponse<AttendanceRecord>> {
    try {
      // Verify device binding first
      const isDeviceBound = await DeviceBindingService.verifyDeviceBinding(studentId);
      if (!isDeviceBound) {
        throw new Error('Device binding verification failed. Please use your registered device.');
      }

      // Get device info for logging
      const currentDeviceInfo = await DeviceBindingService.getDeviceInfo();
      
      // For BLE method, validate beacon
      if (method === 'ble') {
        // Get session beacon info
        const { data: session, error: sessionError } = await supabase
          .from('class_sessions')
          .select(`
            *,
            beacon:ble_beacons(*)
          `)
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          throw new Error('Session not found');
        }

        if (!session.beacon) {
          throw new Error('No beacon assigned to this session');
        }

        // Validate beacon is in range with enrollment and window checks
        const beaconValidation = await BLEService.validateBeaconForAttendance(
          session.beacon.mac_address,
          sessionId,
          studentId
        );

        if (!beaconValidation.valid) {
          throw new Error(beaconValidation.error || 'Beacon validation failed');
        }
      }

      // Check if attendance already exists
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAttendance) {
        throw new Error('Attendance already recorded for this session');
      }

      // Get session and course info
      const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Record attendance
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          method: method.toUpperCase(),
          check_in_time: new Date().toISOString(),
          latitude,
          longitude,
          device_info: {
            ...currentDeviceInfo,
            ...deviceInfo
          },
          course_name: session.course?.name || 'Unknown Course',
          course_code: session.course?.code || 'N/A',
          date: new Date().toISOString().split('T')[0],
          status: 'verified',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data,
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
      console.log('AttendanceService: Fetching attendance for student:', studentId);
      
      // Try a simple query first
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('AttendanceService: Database error:', error);
        throw error;
      }
      
      console.log('AttendanceService: Raw data received:', data?.length || 0);

      return data?.map((record: any) => ({
        id: record.id,
        sessionId: record.session_id,
        studentId: record.student_id,
        method: record.method,
        status: record.status,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time, // <-- add this line
        latitude: record.latitude,
        longitude: record.longitude,
        locationAccuracy: record.location_accuracy,
        deviceInfo: record.device_info,
        verifiedBy: record.verified_by,
        verifiedAt: record.verified_at,
        courseName: record.course_name || 'Unknown Course',
        courseCode: record.course_code || 'UNKNOWN',
        date: record.date || new Date().toISOString().split('T')[0],
        createdAt: record.created_at,
        session: undefined
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
      // Get the user's active enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');
      if (enrollmentsError) throw enrollmentsError;
      if (!enrollments || enrollments.length === 0) {
        return [];
      }
      const courseIds = enrollments.map(e => e.course_id);

      // Get today's date range (local time)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      // Get today's sessions for those courses, with course, instructor, and beacon
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(
            *,
            instructor:users!courses_instructor_id_fkey(*)
          )
        `)
        .gte('session_date', startIso)
        .lt('session_date', endIso)
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
        qrCodeActive: session.qr_code_active,
        qrCodeExpiresAt: session.qr_code_expires_at,
        beaconEnabled: session.beacon_enabled,
        beaconId: session.beacon_id,
        beacon: session.beacon,
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

      const now = new Date();
      const openTime = data.attendance_window_start ? new Date(data.attendance_window_start) : null;
      const closeTime = data.attendance_window_end ? new Date(data.attendance_window_end) : null;

      // If no time windows set, consider it open
      if (!openTime && !closeTime) {
        return true;
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
      // Get total active enrolled courses
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

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

  static async getAllAttendance(): Promise<AttendanceRecord[]> {
    console.log('getAllAttendance called');
    // Return mock data for now
    return [
      {
        id: 'att-1',
        sessionId: 'sess-1',
        studentId: 'S12345',
        method: 'QR',
        status: 'pending',
        checkInTime: '2024-07-01T09:00:00Z',
        courseName: 'Math 101',
        courseCode: 'MATH101',
        date: '2024-07-01',
        createdAt: '2024-07-01T09:00:00Z',
      },
      {
        id: 'att-2',
        sessionId: 'sess-2',
        studentId: 'S54321',
        method: 'QR',
        status: 'verified',
        checkInTime: '2024-07-01T10:00:00Z',
        courseName: 'Physics 201',
        courseCode: 'PHYS201',
        date: '2024-07-01',
        createdAt: '2024-07-01T10:00:00Z',
      },
      // Add more mock records as needed
    ];
  }

  /**
   * Get class sessions for a specific date for a student's courses
   */
  static async getSessionsForDate(studentId: string, date: Date): Promise<ClassSession[]> {
    // Get the user's active enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_course_enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'active');
    if (enrollmentsError) throw enrollmentsError;
    if (!enrollments || enrollments.length === 0) {
      return [];
    }
    const courseIds = enrollments.map(e => e.course_id);

    // Get the date range for the selected day
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    // Fetch sessions for that date
    const { data: sessions, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        course:courses(
          *,
          instructor:users!courses_instructor_id_fkey(*)
        )
      `)
      .gte('session_date', startIso)
      .lt('session_date', endIso)
      .in('course_id', courseIds);

    if (error) throw error;
    return sessions || [];
  }

  /**
   * Get all sessions for a specific beacon MAC address (for beacon detection)
   */
  static async getSessionsForBeacon(beaconMac: string): Promise<ClassSession[]> {
    try {
      // Get today's date range (local time)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      // Get all sessions for the beacon on today's date
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(
            *,
            instructor:users!courses_instructor_id_fkey(*)
          ),
          beacon:ble_beacons(*)
        `)
        .gte('session_date', startIso)
        .lt('session_date', endIso);

      if (error) throw error;

      // Filter sessions that match the beacon MAC
      const matchingSessions = data?.filter((session: any) => {
        const sessionBeaconMac = session.beacon?.mac_address || session.beacon?.macAddress;
        return sessionBeaconMac && sessionBeaconMac.toUpperCase() === beaconMac.toUpperCase();
      }) || [];

      return matchingSessions.map((session: any) => ({
        id: session.id,
        courseId: session.course_id,
        course: session.course,
        instructorId: session.course?.instructor_id,
        instructor: session.course?.instructor,
        sessionDate: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        sessionType: session.session_type,
        qrCodeActive: session.qr_code_active,
        qrCodeExpiresAt: session.qr_code_expires_at,
        beaconEnabled: session.beacon_enabled,
        beaconId: session.beacon_id,
        beacon: session.beacon,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        createdAt: session.created_at
      }));
    } catch (error) {
      console.error('Error fetching sessions for beacon:', error);
      throw error;
    }
  }

  /**
   * Record checkout time for a student's attendance record
   */
  static async recordCheckout(
    sessionId: string,
    studentId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .update({ check_out_time: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('student_id', studentId);
    if (error) throw error;
  }

  /**
   * Get all past sessions for a user's enrolled courses
   */
  static async getPastSessionsForUser(studentId: string): Promise<any[]> {
    // Get the user's active enrolled courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_course_enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'active');
    if (enrollmentsError) throw enrollmentsError;
    if (!enrollments || enrollments.length === 0) {
      return [];
    }
    const courseIds = enrollments.map(e => e.course_id);
    // Get all sessions for those courses that have ended
    const now = new Date().toISOString();
    const { data: sessions, error } = await supabase
      .from('class_sessions')
      .select('*')
      .in('course_id', courseIds)
      .lt('session_date', now);
    if (error) throw error;
    return sessions || [];
  }
} 