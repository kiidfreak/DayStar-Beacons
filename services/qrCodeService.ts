import { supabase } from '@/lib/supabase';

export interface QRValidationRequest {
  qrCodeId: string;
  studentId: string;
}

export interface QRValidationResponse {
  success: boolean;
  courseId: string;
  courseName: string;
  sessionId?: string;
  message: string;
}

export interface ActiveQRResponse {
  id: string;
  courseId: string;
  courseName: string;
  expiresAt: number;
  timeLeft: number; // seconds
}

export class QRCodeService {
  /**
   * Validate QR code and record attendance
   */
  static async validateQRCode(qrCodeId: string, studentId: string): Promise<QRValidationResponse> {
    try {
      console.log('QR Code Service: Validating QR code', { qrCodeId, studentId });

      // First, validate the QR code exists and is not expired
      const { data: qrCode, error: qrError } = await supabase
        .from('check_in_prompts')
        .select(`
          *,
          courses!check_in_prompts_course_id_fkey (
            id,
            name,
            code
          )
        `)
        .eq('id', qrCodeId)
        .gte('expires_at', Date.now())
        .single();

      if (qrError || !qrCode) {
        console.log('QR Code Service: Invalid or expired QR code', qrError);
        throw new Error('Invalid or expired QR code');
      }

      console.log('QR Code Service: QR code found', qrCode);

      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_course_enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', qrCode.course_id)
        .eq('status', 'active')
        .single();

      if (enrollmentError || !enrollment) {
        console.log('QR Code Service: Student not enrolled', enrollmentError);
        throw new Error('You are not enrolled in this course');
      }

      console.log('QR Code Service: Enrollment verified');

      // Use UTC for date and time
      const now = new Date();
      const todayUTC = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const currentTimeUTC = now.toISOString().substr(11, 8); // 'HH:MM:SS'
      const currentTimestamp = now.toISOString();
      
      console.log('Session lookup params (UTC):', {
        course_id: qrCode.course_id,
        session_date: todayUTC,
        currentTimeUTC,
        currentTimestamp,
      });

      // First try to find session using attendance_window_start/end (improved logic)
      let session = null;
      let sessionError = null;

      console.log('Trying attendance window lookup first...');
      const { data: windowSession, error: windowError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('course_id', qrCode.course_id)
        .eq('session_date', todayUTC)
        .not('attendance_window_start', 'is', null)
        .not('attendance_window_end', 'is', null)
        .lte('attendance_window_start', currentTimestamp)
        .gte('attendance_window_end', currentTimestamp)
        .single();

      console.log('Attendance window query result:', { windowSession, windowError });

      if (!windowError && windowSession) {
        session = windowSession;
        console.log('Found session using attendance window');
      } else {
        console.log('No session found with attendance window, trying fallback to start_time/end_time...');
        // Fallback to original logic using start_time/end_time
        const { data: timeSession, error: timeError } = await supabase
          .from('class_sessions')
          .select('*')
          .eq('course_id', qrCode.course_id)
          .eq('session_date', todayUTC)
          .lte('start_time', currentTimeUTC)
          .gte('end_time', currentTimeUTC)
          .single();
        
        console.log('Start/end time query result:', { timeSession, timeError });
        session = timeSession;
        sessionError = timeError;
      }

      if (sessionError || !session) {
        console.log('QR Code Service: No active session found', sessionError);
        throw new Error('No active session found for this course at this time');
      }

      console.log('QR Code Service: Active session found', session);

      // Check if attendance already exists for this session
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('session_id', session.id)
        .single();

      if (existingAttendance) {
        console.log('QR Code Service: Attendance already recorded');
        throw new Error('Attendance already recorded for this session');
      }

      // Create attendance record
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          student_id: studentId,
          session_id: session.id,
          course_id: qrCode.course_id,
          course_code: qrCode.courses?.code || qrCode.course_name,
          course_name: qrCode.courses?.name || qrCode.course_name,
          date: todayUTC,
          status: 'verified',
          method: 'QR',
          check_in_time: new Date().toISOString(),
          verified_by: null
        })
        .select()
        .single();

      if (attendanceError) {
        console.log('QR Code Service: Failed to record attendance', attendanceError);
        throw new Error('Failed to record attendance');
      }

      console.log('QR Code Service: Attendance recorded successfully', attendance);

      return {
        success: true,
        courseId: qrCode.course_id,
        courseName: qrCode.courses?.name || qrCode.course_name,
        sessionId: session.id,
        message: 'Attendance recorded successfully'
      };

    } catch (error) {
      console.error('QR Code Service: Error validating QR code', error);
      return {
        success: false,
        courseId: '',
        courseName: '',
        sessionId: '',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get active QR code for a course
   */
  static async getActiveQRCode(courseId: string): Promise<ActiveQRResponse | null> {
    try {
      const { data, error } = await supabase
        .from('check_in_prompts')
        .select('*')
        .eq('course_id', courseId)
        .gte('expires_at', Date.now())
        .order('created_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const timeLeft = Math.max(0, Math.floor((data.expires_at - Date.now()) / 1000));

      return {
        id: data.id,
        courseId: data.course_id,
        courseName: data.course_name,
        expiresAt: data.expires_at,
        timeLeft
      };
    } catch (error) {
      console.error('QR Code Service: Error getting active QR code', error);
      return null;
    }
  }

  /**
   * Get QR code history for a course
   */
  static async getQRCodeHistory(courseId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('check_in_prompts')
        .select('*')
        .eq('course_id', courseId)
        .order('created_timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('QR Code Service: Error getting QR code history', error);
      return [];
    }
  }
} 