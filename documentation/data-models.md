# Data Models

The application uses several key data models to represent its core entities. These models are defined as TypeScript interfaces in the `types/index.ts` file.

## User

Represents a student user of the application.

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  deviceId: string | null;
  profileImage?: string;
};
```

## Course

Represents an academic course that a student is enrolled in.

```typescript
type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string;
  schedule: string;
  room: string;
  beaconId?: string;
  beaconMacAddress?: string;
  startTime?: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  days?: string[]; // e.g. ["Monday", "Wednesday"]
  attendanceRate?: number; // Percentage of attendance
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
};
```

## AttendanceRecord

Represents a single attendance event for a student in a specific course.

```typescript
type AttendanceRecord = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  date: string;
  checkInTime: string;
  status: 'present' | 'absent' | 'late' | 'qr';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
};
```

## BeaconStatus

Represents the current state of beacon scanning.

```typescript
type BeaconStatus = 'scanning' | 'detected' | 'connected' | 'error' | 'inactive';
```

## CheckInPrompt

Represents a random verification prompt sent to students during class.

```typescript
type CheckInPrompt = {
  id: string;
  courseId: string;
  courseName: string;
  timestamp: number;
  expiresAt: number;
};
```

## QRCodeData

Represents the data structure encoded in QR codes for attendance verification.

```typescript
type QRCodeData = {
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
```

## Notification

Represents system notifications sent to users.

```typescript
type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'attendance' | 'reminder' | 'warning' | 'info';
};
```

## State Stores

The application uses Zustand for state management with several key stores:

### AuthStore

Manages authentication state and user information.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
```

### AttendanceStore

Manages courses, attendance records, and beacon status.

```typescript
interface AttendanceState {
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  currentBeaconStatus: BeaconStatus;
  currentCourse: Course | null;
  checkInPrompt: CheckInPrompt | null;
  
  // Actions
  setBeaconStatus: (status: BeaconStatus) => void;
  setCurrentCourse: (course: Course | null) => void;
  logAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  setCheckInPrompt: (prompt: CheckInPrompt | null) => void;
  respondToCheckInPrompt: (confirmed: boolean) => void;
  getTodayCourses: () => Course[];
  getCourseAttendance: (courseId: string) => AttendanceRecord[];
}
```

### ThemeStore

Manages application theme preferences.

```typescript
interface ThemeState {
  theme: 'light' | 'dark';
  isSystemTheme: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setUseSystemTheme: (useSystem: boolean) => void;
}
```

### UniversityStore

Manages university selection and information.

```typescript
interface UniversityState {
  university: University | null;
  setUniversity: (university: University) => void;
  clearUniversity: () => void;
}
```