import { supabase } from '@/lib/supabase';
import { Course, CourseEnrollmentRequest, ApiResponse } from '@/types';
import { ClassSession } from '@/types';

export class CourseService {
  /**
   * Get courses for a specific student
   */
  static async getStudentCourses(studentId: string): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          course:courses(
            *,
            instructor:users!courses_instructor_id_fkey(
              id,
              full_name,
              email,
              created_at,
              role
            )
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      console.log('DEBUG getStudentCourses: data =', data, 'error =', error);

      return data?.map((enrollment: any) => {
        const course = enrollment.course;
        return {
          id: course.id,
          code: course.code,
          name: course.name,
          description: course.description,
          instructorId: course.instructor_id,
          instructor: course.instructor,
          instructorName: course.instructor?.full_name || 'Unknown Instructor',
          location: course.location,
          schedule: course.schedule,
          schoolId: course.school_id,
          school: course.school,
          department: course.department,
          semester: course.semester,
          academicYear: course.academic_year,
          maxStudents: course.max_students,
          beaconId: course.beacon_id,
          beacon: course.beacon,
          approvalRequired: course.approval_required,
          room: course.location,
          beaconMacAddress: course.beacon?.mac_address,
          startTime: course.start_time,
          endTime: course.end_time,
          days: course.days,
          createdAt: course.created_at,
          updatedAt: course.updated_at,
        } as Course;
      }) || [];
    } catch (error) {
      console.error('Error fetching student courses:', error);
      throw error;
    }
  }

  /**
   * Get available courses for a school (for enrollment)
   */
  static async getAvailableCourses(schoolId: string, studentId: string): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(
            first_name,
            last_name,
            email
          ),
          school:schools(*),
          beacon:ble_beacons(*)
        `)
        .eq('school_id', schoolId);

      if (error) throw error;

      return data?.map((course: any) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        description: course.description,
        instructorId: course.instructor_id,
        instructor: course.instructor,
        instructorName: course.instructor 
          ? `${course.instructor.first_name} ${course.instructor.last_name}`
          : 'Unknown Instructor',
        location: course.location,
        schedule: course.schedule,
        schoolId: course.school_id,
        school: course.school,
        department: course.department,
        semester: course.semester,
        academicYear: course.academic_year,
        maxStudents: course.max_students,
        beaconId: course.beacon_id,
        beacon: course.beacon,
        approvalRequired: course.approval_required,
        room: course.location,
        beaconMacAddress: course.beacon?.mac_address,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      } as Course)) || [];
    } catch (error) {
      console.error('Error fetching available courses:', error);
      throw error;
    }
  }

  /**
   * Request enrollment in a course
   */
  static async requestCourseEnrollment(
    studentId: string, 
    courseId: string
  ): Promise<ApiResponse<CourseEnrollmentRequest>> {
    try {
      const { data, error } = await supabase
        .from('course_enrollment_requests')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        message: 'Enrollment request submitted successfully'
      };
    } catch (error) {
      console.error('Error requesting course enrollment:', error);
      throw error;
    }
  }

  /**
   * Get course details
   */
  static async getCourseDetails(courseId: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(
            first_name,
            last_name,
            email,
            phone
          ),
          school:schools(*),
          beacon:ble_beacons(*)
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description,
        instructorId: data.instructor_id,
        instructor: data.instructor,
        instructorName: data.instructor 
          ? `${data.instructor.first_name} ${data.instructor.last_name}`
          : 'Unknown Instructor',
        location: data.location,
        schedule: data.schedule,
        schoolId: data.school_id,
        school: data.school,
        department: data.department,
        semester: data.semester,
        academicYear: data.academic_year,
        maxStudents: data.max_students,
        beaconId: data.beacon_id,
        beacon: data.beacon,
        approvalRequired: data.approval_required,
        room: data.location,
        beaconMacAddress: data.beacon?.mac_address,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Course;
    } catch (error) {
      console.error('Error fetching course details:', error);
      throw error;
    }
  }

  /**
   * Get all class sessions for a given date for the current student
   */
  static async getSessionsForDate(date: string, studentId: string): Promise<ClassSession[]> {
    try {
      // First, get the student's enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentsError) throw enrollmentsError;
      const courseIds = enrollments?.map((e: any) => e.course_id) || [];
      if (courseIds.length === 0) return [];

      // Now, get class sessions for those courses on the given date
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*, instructor:users!courses_instructor_id_fkey(*))
        `)
        .in('course_id', courseIds)
        .eq('session_date', date);

      if (sessionsError) throw sessionsError;

      // Map to ClassSession type
      return sessions?.map((session: any) => ({
        id: session.id,
        courseId: session.course_id,
        course: session.course,
        instructorId: session.course?.instructor_id,
        instructor: session.course?.instructor,
        sessionDate: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        qrCodeActive: session.qr_code_active ?? false,
        qrCodeExpiresAt: session.qr_code_expires_at,
        beaconEnabled: session.beacon_enabled ?? false,
        beaconId: session.beacon_id,
        beacon: session.beacon,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        sessionType: session.session_type || 'regular',
        createdAt: session.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching sessions for date:', error);
      throw error;
    }
  }

  /**
   * Get all class sessions for a given student (no date filter)
   */
  static async getAllSessionsForStudent(studentId: string): Promise<ClassSession[]> {
    try {
      // Get the student's enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentsError) throw enrollmentsError;
      const courseIds = enrollments?.map((e: any) => e.course_id) || [];
      if (courseIds.length === 0) return [];

      // Get all class sessions for those courses
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*, instructor:users!courses_instructor_id_fkey(*))
        `)
        .in('course_id', courseIds);

      if (sessionsError) throw sessionsError;

      // Map to ClassSession type
      return sessions?.map((session: any) => ({
        id: session.id,
        courseId: session.course_id,
        course: session.course,
        instructorId: session.course?.instructor_id,
        instructor: session.course?.instructor,
        sessionDate: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        qrCodeActive: session.qr_code_active ?? false,
        qrCodeExpiresAt: session.qr_code_expires_at,
        beaconEnabled: session.beacon_enabled ?? false,
        beaconId: session.beacon_id,
        beacon: session.beacon,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        sessionType: session.session_type || 'regular',
        createdAt: session.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching all sessions for student:', error);
      throw error;
    }
  }
} 