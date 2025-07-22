export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin' | 'head_lecturer' | 'system_admin';
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
  schoolId?: string;
  school?: School;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  department?: string;
  employeeId?: string;
  name: string; // Computed field: firstName + lastName
  deviceId?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BLEBeacon {
  id: string;
  beaconUid: string;
  macAddress: string;
  name: string;
  schoolId: string;
  school?: School;
  location?: string;
  batteryLevel?: number;
  signalStrength?: number;
  status: 'active' | 'inactive' | 'maintenance' | 'lost';
  assignedToCourse?: string;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  instructorId: string;
  instructor?: User;
  instructorName: string; // Computed field for easier access
  location?: string;
  schedule?: any;
  schoolId: string;
  school?: School;
  department?: string;
  semester?: string;
  academicYear?: string;
  maxStudents: number;
  beaconId?: string;
  beacon?: BLEBeacon;
  approvalRequired: boolean;
  // Mobile app specific fields
  room?: string;
  beaconMacAddress?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  attendanceRate?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollmentRequest {
  id: string;
  studentId: string;
  student?: User;
  courseId: string;
  course?: Course;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewer?: User;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface SchoolMembershipRequest {
  id: string;
  studentId: string;
  student?: User;
  schoolId: string;
  school?: School;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewer?: User;
  reviewedAt?: string;
  reviewNotes?: string;
  studentIdDocument?: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  course?: Course;
  instructorId: string;
  instructor?: User;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  qrCodeActive: boolean;
  qrCodeExpiresAt?: string;
  beaconEnabled: boolean;
  beaconId?: string;
  beacon?: BLEBeacon;
  attendanceWindowStart?: string;
  attendanceWindowEnd?: string;
  sessionType: 'regular' | 'makeup' | 'exam' | 'lab';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  course_code: string;
  check_in_time: string;
  check_out_time?: string; // Added for checkout functionality
  status: 'pending' | 'present' | 'absent';
  created_at: string;
}

export interface CourseSession {
  id: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BeaconSession {
  id: string;
  beacon_id: string;
  course_id: string;
  start_time: string;
  end_time: string;
  session_date: string;
  attendance_window_start?: string;
  attendance_window_end?: string;
  course_name?: string; // Added for UI display
}

export type BeaconStatus = 'scanning' | 'detected' | 'connected' | 'error' | 'inactive';

export type CheckInPrompt = {
  id: string;
  courseId: string;
  courseName: string;
  timestamp: number;
  expiresAt: number;
};

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'attendance' | 'reminder' | 'warning' | 'info';
};

export type QRCodeData = {
  type: 'attendance';
  courseId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  instructorId: string;
  sessionId: string;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Registration types
export interface StudentRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phone?: string;
  schoolId: string;
  department?: string;
}