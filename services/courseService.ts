import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Course, CourseEnrollmentRequest, ApiResponse } from '@/types';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'enrolled' | 'pending' | 'dropped';
  enrollment_date: string;
  course: Course;
}

export interface ClassSession {
  id: string;
  course_id: string;
  course_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  beacon_id?: string;
  beacon_mac_address?: string;
}

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
      
      // Fetch courses with instructor information
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(
            id,
            full_name,
            email,
            role
          )
        `)
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
        instructorId: course.instructor_id,
        instructor: course.instructor,
        instructorName: course.instructor?.full_name || 'Unknown Instructor',
        location: course.location,
        schedule: course.schedule,
        schoolId: course.school_id || 'daystar-university',
        school: undefined,
        department: course.department,
        semester: course.semester,
        academicYear: course.academic_year,
        maxStudents: course.max_students || 50,
        credits: course.credits || 3,
        beaconId: course.beacon_id,
        beacon: undefined,
        approvalRequired: course.approval_required || false,
        room: course.room,
        beaconMacAddress: course.beacon_mac_address,
        startTime: course.start_time,
        endTime: course.end_time,
        days: course.days,
        description: course.description,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
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
      let enrolledIds: string[] = [];
      if (
        studentId &&
        typeof studentId === 'string' &&
        studentId.trim() !== '' &&
        studentId !== 'null' &&
        studentId !== 'undefined'
      ) {
        // Get enrolled course IDs only if studentId is valid
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('student_course_enrollments')
          .select('course_id')
          .eq('student_id', studentId)
          .eq('status', 'active');

        if (enrollmentsError) {
          console.error('getAvailableCourses: enrollmentsError', enrollmentsError);
          throw enrollmentsError;
        }
        enrolledIds = enrollments?.map(e => e.course_id) || [];
        console.log('getAvailableCourses: enrolledIds', enrolledIds);
      }

      // Get all courses NOT in enrolledIds
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(
            id,
            full_name,
            email,
            role
          )
        `);

      if (enrolledIds.length > 0) {
        console.log('getAvailableCourses: filtering out enrolledIds', enrolledIds);
        // Use the correct Supabase syntax for NOT IN
        query = query.not('id', 'in', enrolledIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error('getAvailableCourses: courses query error', error);
        throw error;
      }
      console.log('getAvailableCourses: fetched courses', data);

      return data?.map((course: any) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        instructorId: course.instructor_id,
        instructor: course.instructor,
        instructorName: course.instructor?.full_name || 'Unknown Instructor',
        schoolId: course.school_id || schoolId || 'daystar-university',
        maxStudents: course.max_students || 50,
        credits: course.credits || 3,
        approvalRequired: course.approval_required || false,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        location: course.location,
        schedule: course.schedule,
        department: course.department,
        semester: course.semester,
        academicYear: course.academic_year,
        beaconId: course.beacon_id,
        beacon: course.beacon,
        room: course.room,
        beaconMacAddress: course.beacon_mac_address,
        startTime: course.start_time,
        endTime: course.end_time,
        days: course.days,
        description: course.description,
      })) || [];
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
        description: data.description,
        instructorId: data.instructor_id,
        instructor: data.instructor,
        instructorName: data.instructor?.full_name || 'Unknown Instructor',
        location: data.location,
        schedule: data.schedule,
        schoolId: data.school_id || 'daystar-university',
        school: data.school,
        department: data.department,
        semester: data.semester,
        academicYear: data.academic_year,
        maxStudents: data.max_students || 50,
        credits: data.credits || 3,
        beaconId: data.beacon_id,
        beacon: data.beacon,
        approvalRequired: data.approval_required || false,
        room: data.room,
        beaconMacAddress: data.beacon_mac_address,
        startTime: data.start_time,
        endTime: data.end_time,
        days: data.days,
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
        course_id: session.course_id,
        course_name: session.course?.name || '',
        start_time: session.start_time,
        end_time: session.end_time,
        is_active: session.is_active || true,
        beacon_id: session.beacon_id,
        beacon_mac_address: session.beacon_mac_address,
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
        course_id: session.course_id,
        course_name: session.course?.name || '',
        start_time: session.start_time,
        end_time: session.end_time,
        is_active: session.is_active || true,
        beacon_id: session.beacon_id,
        beacon_mac_address: session.beacon_mac_address,
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
      const enrollmentObj = {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        enrollment_date: new Date().toISOString(),
      };
      console.log('Inserting into student_course_enrollments:', enrollmentObj);
      const { data, error } = await supabase
        .from('student_course_enrollments')
        .insert(enrollmentObj)
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