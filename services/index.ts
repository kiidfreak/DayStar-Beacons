// Service exports for the UniConnect mobile app

export { CourseService } from './courseService';
export { AttendanceService } from './attendanceService';

// Re-export types for convenience
export type { 
  Course, 
  AttendanceRecord, 
  ClassSession, 
  ApiResponse,
  CourseEnrollmentRequest,
  BLEBeacon,
  User,
  School
} from '@/types'; 