# API Reference

This document outlines the key APIs and hooks used in the University Attendance Tracking System. While the current implementation uses mock data, these interfaces are designed to be compatible with real backend services in the future.

## Authentication API

### Login

**Purpose**: Authenticates a user with their credentials

**Current Implementation**: Mock function in `authStore.ts`

```typescript
const mockLogin = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === "student@uni.edu" && password === "password") {
    return {
      user: {
        id: "1",
        name: "John Doe",
        email: "student@uni.edu",
        studentId: "S12345",
        deviceId: "device-123"
      },
      token: "mock-jwt-token"
    };
  }
  
  throw new Error("Invalid credentials");
};
```

**Future API Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "student@uni.edu",
  "password": "password"
}
```

**Response**:
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "student@uni.edu",
    "studentId": "S12345",
    "deviceId": "device-123"
  },
  "token": "jwt-token-here"
}
```

## Attendance API

### Log Attendance

**Purpose**: Records a student's attendance for a specific course

**Current Implementation**: Function in `attendanceStore.ts`

```typescript
logAttendance: (record: Omit<AttendanceRecord, 'id'>) => {
  const newRecord: AttendanceRecord = {
    ...record,
    id: `att-${Date.now()}`
  };
  
  set((state) => ({
    attendanceRecords: [newRecord, ...state.attendanceRecords]
  }));
}
```

**Future API Endpoint**: `POST /api/attendance`

**Request Body**:
```json
{
  "courseId": "course-1",
  "date": "2025-06-25",
  "checkInTime": "10:05",
  "status": "present",
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219,
    "accuracy": 5
  }
}
```

**Response**:
```json
{
  "id": "att-12345",
  "courseId": "course-1",
  "courseName": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2025-06-25",
  "checkInTime": "10:05",
  "status": "present",
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219,
    "accuracy": 5
  }
}
```

### Get Attendance History

**Purpose**: Retrieves a student's attendance history

**Current Implementation**: Function in `attendanceStore.ts`

```typescript
getCourseAttendance: (courseId: string) => {
  return get().attendanceRecords
    .filter(record => record.courseId === courseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

**Future API Endpoint**: `GET /api/attendance?courseId=course-1`

**Response**:
```json
{
  "records": [
    {
      "id": "att-1",
      "courseId": "course-1",
      "courseName": "Introduction to Computer Science",
      "courseCode": "CS101",
      "date": "2025-06-10",
      "checkInTime": "10:05",
      "status": "present",
      "location": {
        "latitude": -1.2921,
        "longitude": 36.8219,
        "accuracy": 5
      }
    },
    // Additional records...
  ]
}
```

## Course API

### Get Courses

**Purpose**: Retrieves all courses for the authenticated student

**Current Implementation**: Mock data in `attendanceStore.ts`

```typescript
const mockCourses: Course[] = [
  {
    id: "course-1",
    name: "Introduction to Computer Science",
    code: "CS101",
    instructor: "Dr. Smith",
    schedule: "Mon, Wed 10:00-11:30",
    room: "Building A, Room 101",
    beaconId: "beacon-101",
    beaconMacAddress: "00:11:22:33:44:55",
    startTime: "10:00",
    endTime: "11:30",
    days: ["Monday", "Wednesday"],
    location: {
      latitude: -1.2921,
      longitude: 36.8219,
      address: "Building A, Room 101, University Campus"
    }
  },
  // Additional courses...
];
```

**Future API Endpoint**: `GET /api/courses`

**Response**:
```json
{
  "courses": [
    {
      "id": "course-1",
      "name": "Introduction to Computer Science",
      "code": "CS101",
      "instructor": "Dr. Smith",
      "schedule": "Mon, Wed 10:00-11:30",
      "room": "Building A, Room 101",
      "beaconId": "beacon-101",
      "beaconMacAddress": "00:11:22:33:44:55",
      "startTime": "10:00",
      "endTime": "11:30",
      "days": ["Monday", "Wednesday"],
      "location": {
        "latitude": -1.2921,
        "longitude": 36.8219,
        "address": "Building A, Room 101, University Campus"
      }
    }
  ]
}
```

### Get Today's Courses

**Purpose**: Retrieves courses scheduled for the current day

**Current Implementation**: Function in `attendanceStore.ts`

```typescript
getTodayCourses: () => {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  
  return get().courses.filter(course => 
    course.days?.includes(dayOfWeek)
  ).sort((a, b) => {
    // Sort by start time
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });
}
```

**Future API Endpoint**: `GET /api/courses/today`

**Response**: Same format as Get Courses, filtered for today's date

## QR Code API

### Validate QR Code

**Purpose**: Validates a scanned QR code for attendance

**Current Implementation**: Function in `qr-scanner.tsx`

```typescript
const validateQRCode = async (qrData: QRData): Promise<ValidationResult> => {
  // Validation logic as described in the security section
};
```

**Future API Endpoint**: `POST /api/attendance/validate-qr`

**Request Body**:
```json
{
  "qrData": {
    "type": "attendance",
    "courseId": "course-1",
    "timestamp": 1624512345678,
    "expiresAt": 1624512645678,
    "signature": "signature-string",
    "location": {
      "latitude": -1.2921,
      "longitude": 36.8219,
      "accuracy": 10
    },
    "instructorId": "instructor-1",
    "sessionId": "session-12345"
  },
  "userLocation": {
    "latitude": -1.2922,
    "longitude": 36.8220,
    "accuracy": 5
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully checked in to Introduction to Computer Science",
  "details": {
    "timeValid": true,
    "locationValid": true,
    "signatureValid": true,
    "courseFound": true,
    "locationSkipped": false
  }
}
```

## Custom Hooks

### useBeacon

**Purpose**: Manages BLE beacon scanning and connection

**Implementation**: `hooks/useBeacon.ts`

**Usage**:
```typescript
const { isScanning, startScanning, stopScanning } = useBeacon();
```

**Methods**:
- `startScanning()`: Begins scanning for classroom beacons
- `stopScanning()`: Stops the beacon scanning process
- `isScanning`: Boolean indicating if scanning is active

### useTheme

**Purpose**: Provides theme colors and utilities

**Implementation**: `hooks/useTheme.ts`

**Usage**:
```typescript
const { colors, isDark } = useTheme();
```

**Properties**:
- `colors`: Object containing all theme colors
- `isDark`: Boolean indicating if dark mode is active