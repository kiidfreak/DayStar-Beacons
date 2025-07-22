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

      // Fetch QR code details
      console.log('QR Code Service: Fetching QR code details...');
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
        console.log('QR Code Service: QR code not found', qrError);
        throw new Error('Invalid QR code');
      }

      console.log('QR Code Service: QR code found', qrCode);

      // Check enrollment
      console.log('QR Code Service: Checking enrollment...');
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
      
      console.log('=== QR CODE SESSION LOOKUP DEBUG ===');
      console.log('Current time info:', {
        localTime: now.toString(),
        utcTime: now.toUTCString(),
        isoString: currentTimestamp,
        course_id: qrCode.course_id,
        session_date: todayUTC,
        currentTimeUTC,
        currentTimestamp,
      });

      // First, let's see ALL sessions for this course today
      console.log('QR Code Service: Fetching ALL sessions for today to debug...');
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('course_id', qrCode.course_id)
        .eq('session_date', todayUTC);
      
      console.log('All sessions for today:', { allSessions, allSessionsError });
      
      if (allSessions && allSessions.length > 0) {
        allSessions.forEach((s: any, index: number) => {
          console.log(`Session ${index + 1}:`, {
            id: s.id,
            start_time: s.start_time,
            end_time: s.end_time,
            attendance_window_start: s.attendance_window_start,
            attendance_window_end: s.attendance_window_end,
            session_date: s.session_date
          });
          
          // Check if current time falls within attendance window
          if (s.attendance_window_start && s.attendance_window_end) {
            const windowStart = new Date(s.attendance_window_start);
            const windowEnd = new Date(s.attendance_window_end);
            const isInWindow = now >= windowStart && now <= windowEnd;
            console.log(`  Attendance window check: ${isInWindow} (${windowStart.toISOString()} <= ${currentTimestamp} <= ${windowEnd.toISOString()})`);
          }
          
          // Check if current time falls within session time
          if (s.start_time && s.end_time) {
            const sessionStart = s.start_time;
            const sessionEnd = s.end_time;
            const isInSession = currentTimeUTC >= sessionStart && currentTimeUTC <= sessionEnd;
            console.log(`  Session time check: ${isInSession} (${sessionStart} <= ${currentTimeUTC} <= ${sessionEnd})`);
          }
        });
      }

      // First try to find session using attendance_window_start/end (improved logic)
      let session = null;
      let sessionError = null;

      console.log('QR Code Service: Trying attendance window lookup first...');
      const { data: windowSession, error: windowError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('course_id', qrCode.course_id)
        .eq('session_date', todayUTC)
        .not('attendance_window_start', 'is', null)
        .not('attendance_window_end', 'is', null)
        .lte('attendance_window_start', currentTimestamp)
        .gte('attendance_window_end', currentTimestamp);

      console.log('QR Code Service: Attendance window query result:', { windowSession, windowError });

      if (!windowError && windowSession && windowSession.length > 0) {
        session = windowSession[0]; // Take first match
        console.log('QR Code Service: Found session using attendance window');
      } else {
        console.log('QR Code Service: No session found with attendance window, trying fallback to start_time/end_time...');
        // Fallback to original logic using start_time/end_time
        const { data: timeSession, error: timeError } = await supabase
          .from('class_sessions')
          .select('*')
          .eq('course_id', qrCode.course_id)
          .eq('session_date', todayUTC)
          .lte('start_time', currentTimeUTC)
          .gte('end_time', currentTimeUTC);
        
        console.log('QR Code Service: Start/end time query result:', { timeSession, timeError });
        if (!timeError && timeSession && timeSession.length > 0) {
          session = timeSession[0]; // Take first match
        } else {
          sessionError = timeError;
        }
      }

      // If still no session found, try a more lenient approach
      if (!session) {
        console.log('QR Code Service: Trying lenient session lookup (any session today)...');
        const { data: anySession, error: anyError } = await supabase
          .from('class_sessions')
          .select('*')
          .eq('course_id', qrCode.course_id)
          .eq('session_date', todayUTC)
          .limit(1);
        
        console.log('QR Code Service: Any session query result:', { anySession, anyError });
        
        if (!anyError && anySession && anySession.length > 0) {
          session = anySession[0];
          console.log('QR Code Service: Found session using lenient lookup (ignoring time constraints)');
          console.log('WARNING: Using session outside normal attendance window - this may be for testing');
        }
      }

      if (!session) {
        console.log('QR Code Service: No session found at all for today', sessionError);
        console.log('DEBUG: Available sessions check completed. No valid session found.');
        throw new Error('No active session found for this course at this time');
      }

      console.log('QR Code Service: Active session found', session);

      // Check if attendance already exists for this session
      console.log('QR Code Service: Checking for existing attendance...');
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('session_id', session.id)
        .single();

      console.log('QR Code Service: Existing attendance check result:', { existingAttendance, checkError });
      
      if (existingAttendance) {
        console.log('QR Code Service: Attendance already recorded');
        throw new Error('Attendance already recorded for this session');
      }

      // Create attendance record
      console.log('QR Code Service: Creating attendance record...');
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