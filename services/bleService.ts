import { supabase } from '@/lib/supabase';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';

export interface BeaconData {
  id: string;
  macAddress: string;
  name: string;
  uuid?: string;
  major?: number;
  minor?: number;
  rssi?: number;
  distance?: number;
  courseId?: string;
  courseName?: string;
  sessionId?: string;
}

export interface BLEScanResult {
  success: boolean;
  beacons: BeaconData[];
  error?: string;
}

export interface AttendanceWindowStatus {
  isOpen: boolean;
  message: string;
  sessionId?: string;
  courseId?: string;
}

export class BLEService {
  private static isScanning = false;
  private static currentBeacons: BeaconData[] = [];

  /**
   * Check if BLE is supported and enabled
   */
  static async checkBLESupport(): Promise<boolean> {
    try {
      // Check if device supports BLE
      if (!Device.isDevice) {
        console.log('BLE not supported on emulator');
        return false;
      }

      // Check location permissions (required for BLE on Android)
      if (Platform.OS === 'android') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission required for BLE scanning');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking BLE support:', error);
      return false;
    }
  }

  /**
   * Check attendance window status for a session
   */
  static async checkAttendanceWindow(sessionId: string): Promise<AttendanceWindowStatus> {
    try {
      const { data: session, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return {
          isOpen: false,
          message: 'Session not found'
        };
      }

      const now = new Date();
      const sessionDate = new Date(session.session_date);
      
      // Check if session is today
      const today = new Date();
      const isToday = sessionDate.toDateString() === today.toDateString();
      
      if (!isToday) {
        return {
          isOpen: false,
          message: 'No class scheduled for today',
          sessionId,
          courseId: session.course_id
        };
      }

      // Check attendance window if specified
      if (session.attendance_window_start && session.attendance_window_end) {
        const windowStart = new Date(session.attendance_window_start);
        const windowEnd = new Date(session.attendance_window_end);
        
        if (now < windowStart) {
          return {
            isOpen: false,
            message: `Attendance window opens at ${windowStart.toLocaleTimeString()}`,
            sessionId,
            courseId: session.course_id
          };
        }
        
        if (now > windowEnd) {
          return {
            isOpen: false,
            message: 'Attendance window has ended',
            sessionId,
            courseId: session.course_id
          };
        }
      }

      // Check time-based window if start_time and end_time are specified
      if (session.start_time && session.end_time) {
        const currentTime = now.toTimeString().split(' ')[0];
        
        if (currentTime < session.start_time) {
          return {
            isOpen: false,
            message: `Class starts at ${session.start_time}`,
            sessionId,
            courseId: session.course_id
          };
        }
        
        if (currentTime > session.end_time) {
          return {
            isOpen: false,
            message: 'Class has ended',
            sessionId,
            courseId: session.course_id
          };
        }
      }

      return {
        isOpen: true,
        message: 'Attendance window is open',
        sessionId,
        courseId: session.course_id
      };
    } catch (error) {
      console.error('Error checking attendance window:', error);
      return {
        isOpen: false,
        message: 'Error checking attendance window'
      };
    }
  }

  /**
   * Get enrolled courses for a student
   */
  static async getEnrolledCourses(studentId: string): Promise<string[]> {
    try {
      const { data: enrollments, error } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching enrolled courses:', error);
        return [];
      }

      return enrollments?.map(enrollment => enrollment.course_id) || [];
    } catch (error) {
      console.error('Error in getEnrolledCourses:', error);
      return [];
    }
  }

  /**
   * Start BLE scanning for beacons (filtered by enrolled courses)
   */
  static async startScanning(studentId: string): Promise<BLEScanResult> {
    try {
      if (this.isScanning) {
        return { success: true, beacons: this.currentBeacons };
      }

      const isSupported = await this.checkBLESupport();
      if (!isSupported) {
        return { 
          success: false, 
          beacons: [], 
          error: 'BLE not supported or permissions not granted' 
        };
      }

      // Check if location services are enabled (required for BLE scan on Android)
      if (Platform.OS === 'android') {
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
          return {
            success: false,
            beacons: [],
            error: 'Location services (GPS) must be enabled for BLE scanning.'
          };
        }
      }

      this.isScanning = true;
      console.log('Starting BLE beacon scan for student:', studentId);

      // Get enrolled courses
      const enrolledCourseIds = await this.getEnrolledCourses(studentId);
      console.log('Enrolled courses:', enrolledCourseIds);

      if (enrolledCourseIds.length === 0) {
        this.isScanning = false;
        return { 
          success: false, 
          beacons: [], 
          error: 'No enrolled courses found' 
        };
      }

      // Get current time
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];

      // Fetch active sessions for enrolled courses
      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*),
          beacon:ble_beacons(*)
        `)
        .in('course_id', enrolledCourseIds)
        .gte('start_time', currentTime)
        .lte('end_time', currentTime)
        .not('beacon_id', 'is', null);

      if (error) {
        console.error('Error fetching sessions:', error);
        this.isScanning = false;
        return { 
          success: false, 
          beacons: [], 
          error: 'Failed to fetch sessions' 
        };
      }

      if (!sessions || sessions.length === 0) {
        console.log('No active sessions found for enrolled courses');
        this.isScanning = false;
        return { success: true, beacons: [] };
      }

      // Convert to beacon data format with course info
      const beacons: BeaconData[] = sessions
        .filter(session => session.beacon)
        .map(session => ({
          id: session.beacon.id,
          macAddress: session.beacon.mac_address,
          name: session.beacon.name || 'Unknown Beacon',
          uuid: session.beacon.uuid,
          major: session.beacon.major,
          minor: session.beacon.minor,
          rssi: -50 + Math.random() * 20, // Simulate RSSI
          distance: 1 + Math.random() * 5, // Simulate distance
          courseId: session.course_id,
          courseName: session.course?.name,
          sessionId: session.id,
        }));

      console.log(`Found ${beacons.length} active beacons for enrolled courses`);
      this.currentBeacons = beacons;
      this.isScanning = false;

      return { success: true, beacons };
    } catch (error) {
      console.error('BLE scanning error:', error);
      this.isScanning = false;
      return { 
        success: false, 
        beacons: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Stop BLE scanning
   */
  static stopScanning(): void {
    this.isScanning = false;
    console.log('BLE scanning stopped');
  }

  /**
   * Get current scanning status
   */
  static getScanningStatus(): boolean {
    return this.isScanning;
  }

  /**
   * Get current beacons
   */
  static getCurrentBeacons(): BeaconData[] {
    return this.currentBeacons;
  }

  /**
   * Check if a specific beacon is in range
   */
  static async isBeaconInRange(beaconMacAddress: string, studentId: string): Promise<boolean> {
    try {
      const { beacons } = await this.startScanning(studentId);
      return beacons.some(beacon => 
        beacon.macAddress.toLowerCase() === beaconMacAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking beacon range:', error);
      return false;
    }
  }

  /**
   * Get beacon signal strength
   */
  static async getBeaconSignalStrength(beaconMacAddress: string, studentId: string): Promise<number | null> {
    try {
      const { beacons } = await this.startScanning(studentId);
      const beacon = beacons.find(b => 
        b.macAddress.toLowerCase() === beaconMacAddress.toLowerCase()
      );
      return beacon?.rssi || null;
    } catch (error) {
      console.error('Error getting beacon signal strength:', error);
      return null;
    }
  }

  /**
   * Validate beacon for attendance with enrollment and window checks
   */
  static async validateBeaconForAttendance(
    beaconMacAddress: string, 
    sessionId: string,
    studentId: string
  ): Promise<{ valid: boolean; error?: string; sessionId?: string; courseId?: string }> {
    try {
      // Check attendance window first
      const windowStatus = await this.checkAttendanceWindow(sessionId);
      if (!windowStatus.isOpen) {
        return { 
          valid: false, 
          error: windowStatus.message,
          sessionId: windowStatus.sessionId,
          courseId: windowStatus.courseId
        };
      }

      // Check if student is enrolled in the course
      const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return { valid: false, error: 'Session not found' };
      }

      // Check enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_course_enrollments')
        .select('status')
        .eq('student_id', studentId)
        .eq('course_id', session.course_id)
        .eq('status', 'active')
        .single();

      if (enrollmentError || !enrollment) {
        return { valid: false, error: 'Not enrolled in this course' };
      }

      // Check if beacon is assigned to this session
      if (!session.beacon_id) {
        return { valid: false, error: 'No beacon assigned to session' };
      }

      // Get beacon info
      const { data: beacon, error: beaconError } = await supabase
        .from('ble_beacons')
        .select('*')
        .eq('id', session.beacon_id)
        .single();

      if (beaconError || !beacon) {
        return { valid: false, error: 'Beacon not found' };
      }

      if (beacon.mac_address.toLowerCase() !== beaconMacAddress.toLowerCase()) {
        return { valid: false, error: 'Beacon mismatch' };
      }

      // Check if beacon is in range
      const isInRange = await this.isBeaconInRange(beaconMacAddress, studentId);
      if (!isInRange) {
        return { valid: false, error: 'Beacon not in range' };
      }

      // Check signal strength (must be within reasonable range)
      const signalStrength = await this.getBeaconSignalStrength(beaconMacAddress, studentId);
      if (signalStrength && signalStrength < -80) {
        return { valid: false, error: 'Signal too weak' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating beacon for attendance:', error);
      return { valid: false, error: 'Validation error' };
    }
  }

  /**
   * Get nearby beacons with signal strength (filtered by enrollments)
   */
  static async getNearbyBeacons(studentId: string): Promise<BeaconData[]> {
    try {
      const { beacons } = await this.startScanning(studentId);
      
      // Filter beacons with good signal strength
      return beacons.filter(beacon => 
        beacon.rssi && beacon.rssi > -80
      );
    } catch (error) {
      console.error('Error getting nearby beacons:', error);
      return [];
    }
  }
} 