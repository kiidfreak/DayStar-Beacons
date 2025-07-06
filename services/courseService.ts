import { supabase } from '@/lib/supabase';
import { Course, CourseEnrollmentRequest, ApiResponse } from '@/types';
import { ClassSession } from '@/types';

export class CourseService {
  /**
   * Get courses for a specific student
   */
  static async getStudentCourses(studentId: string): Promise<Course[]> {
    try {
      console.log('CourseService: Fetching courses for student:', studentId);
      
      // Get active enrollments from student_course_enrollments table
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('CourseService: Enrollments query error:', enrollmentsError);
        throw enrollmentsError;
      }
      
      console.log('CourseService: Found enrollments:', enrollments?.length || 0);
      
      if (!enrollments || enrollments.length === 0) {
        console.log('CourseService: No enrollments found, returning empty array');
        return [];
      }
      
      // Get course IDs
      const courseIds = enrollments.map(e => e.course_id);
      
      // Fetch courses with simple query
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);

      if (coursesError) {
        console.error('CourseService: Courses query error:', coursesError);
        throw coursesError;
      }
      
      console.log('CourseService: Found courses:', courses?.length || 0);

      return courses?.map((course: any) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        description: undefined,
        instructorId: course.instructor_id,
        instructor: undefined,
        instructorName: 'Unknown Instructor',
        location: undefined,
        schedule: undefined,
        schoolId: 'daystar-university', // Default school ID
        school: undefined,
        department: undefined,
        semester: undefined,
        academicYear: undefined,
        maxStudents: 50, // Default value
        beaconId: undefined,
        beacon: undefined,
        approvalRequired: false, // Default value
        room: undefined,
        beaconMacAddress: undefined,
        startTime: undefined,
        endTime: undefined,
        days: undefined,
        createdAt: course.created_at,
        updatedAt: course.created_at,
      } as Course)) || [];
    } catch (error) {
      console.error('Error fetching student courses:', error);
      throw error;
    }
  }

  /**
   * Get available courses for enrollment
   */
  static async getAvailableCourses(schoolId: string, studentId: string | null): Promise<Course[]> {

    
    try {
      // For registration, just get all courses
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(
            id,
            full_name,
            email,
            role
          ),
          class_sessions(
            *,
            beacon:ble_beacons(*)
          )
        `);

  
      if (error) throw error;

      return data?.map((course: any) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        description: undefined,
        instructorId: course.instructor_id,
        instructor: course.instructor,
        instructorName: course.instructor?.full_name || 'Unknown Instructor',
        location: undefined,
        schedule: undefined,
        schoolId: 'daystar-university', // Default school ID
        school: undefined,
        department: undefined,
        semester: undefined,
        academicYear: undefined,
        maxStudents: 50, // Default value
        beaconId: undefined,
        beacon: undefined,
        approvalRequired: false, // Default value
        room: undefined,
        beaconMacAddress: undefined,
        createdAt: course.created_at,
        updatedAt: course.created_at,
      } as Course)) || [];
    } catch (error) {
      console.error('Error fetching available courses:', error);
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
        description: undefined,
        instructorId: data.instructor_id,
        instructor: data.instructor,
        instructorName: data.instructor?.full_name || 'Unknown Instructor',
        location: undefined,
        schedule: undefined,
        schoolId: 'daystar-university', // Default school ID
        school: undefined,
        department: undefined,
        semester: undefined,
        academicYear: undefined,
        maxStudents: 50, // Default value
        beaconId: undefined,
        beacon: undefined,
        approvalRequired: false, // Default value
        room: undefined,
        beaconMacAddress: undefined,
        createdAt: data.created_at,
        updatedAt: data.created_at,
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
      // Get the student's active enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

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
        qrCodeActive: false, // Default value
        qrCodeExpiresAt: undefined,
        beaconEnabled: !!session.beacon_id, // True if beacon assigned
        beaconId: session.beacon_id,
        beacon: session.beacon,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        sessionType: 'regular', // Default value
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
      // Get the student's active enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

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
        qrCodeActive: false, // Default value
        qrCodeExpiresAt: undefined,
        beaconEnabled: !!session.beacon_id, // True if beacon assigned
        beaconId: session.beacon_id,
        beacon: session.beacon,
        attendanceWindowStart: session.attendance_window_start,
        attendanceWindowEnd: session.attendance_window_end,
        sessionType: 'regular', // Default value
        createdAt: session.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching all sessions for student:', error);
      throw error;
    }
  }

  /**
   * Enroll student in a course directly (for self-enrollment)
   */
  static async enrollStudentInCourse(
    studentId: string, 
    courseId: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'active',
          enrollment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        message: 'Enrollment successful'
      };
    } catch (error) {
      console.error('Error enrolling student in course:', error);
      throw error;
    }
  }

  /**
   * Get enrollment status for a student in a course
   */
  static async getEnrollmentStatus(
    studentId: string, 
    courseId: string
  ): Promise<'enrolled' | 'pending' | 'not_enrolled'> {
    try {
      // Check enrollment status in student_course_enrollments table
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .select('status')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        console.error('Error checking enrollment:', error);
        return 'not_enrolled';
      }

      if (!data) {
        return 'not_enrolled';
      }

      // Map status to enrollment state
      switch (data.status) {
        case 'active':
          return 'enrolled';
        case 'pending':
          return 'pending';
        case 'inactive':
          return 'not_enrolled';
        default:
          return 'not_enrolled';
      }
    } catch (error) {
      console.error('Error getting enrollment status:', error);
      return 'not_enrolled';
    }
  }

  /**
   * Debug method to test enrollment status
   */
  static async debugEnrollmentStatus(
    studentId: string, 
    courseId: string
  ): Promise<any> {
    try {
      console.log('🔍 Debug: Checking enrollment for student:', studentId, 'course:', courseId);
      
      // Check student_course_enrollments table
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_course_enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      console.log('🔍 Debug: Enrollment data:', enrollment);
      console.log('🔍 Debug: Enrollment error:', enrollmentError);

      return {
        enrollment,
        error: enrollmentError,
        status: enrollment?.status || 'not_found'
      };
    } catch (error) {
      console.error('🔍 Debug: Error in debugEnrollmentStatus:', error);
      return { error };
    }
  }
} 