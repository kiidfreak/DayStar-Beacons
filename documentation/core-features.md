# Core Features

## 1. Dual Attendance Verification Methods

### Bluetooth Beacon Attendance (Automatic)

The system uses BLE beacons placed in classrooms to automatically detect and verify student presence:

- **Proximity Detection**: The app scans for classroom-specific beacons
- **Automatic Check-in**: When a student enters the classroom, the app detects the beacon and logs attendance
- **Time Window**: Scanning is active during the first 10 minutes of class
- **Status Tracking**: The app shows the current beacon connection status (scanning, detected, connected, error)

Implementation: `useBeacon.ts` hook manages the BLE scanning lifecycle and attendance logging.

### QR Code Attendance (Manual)

As an alternative or backup method, instructors can generate QR codes for students to scan:

- **Secure QR Generation**: QR codes contain encrypted course information, timestamps, and location data
- **Time-Limited Validity**: QR codes expire after 5 minutes to prevent sharing
- **Location Validation**: Verifies the student is physically present in the classroom
- **Anti-Tampering**: Digital signature prevents QR code manipulation

Implementation: `qr-scanner.tsx` handles scanning and validation, while `qrSecurity.ts` provides security utilities.

## 2. Attendance Management

- **Real-time Status**: Shows current class and attendance status
- **History Tracking**: Maintains a complete record of attendance for all courses
- **Statistics**: Displays attendance rates and patterns
- **Multiple Status Types**: Records different attendance states (present, absent, late, QR check-in)

## 3. Course Management

- **Course Listing**: Displays all enrolled courses
- **Today's Schedule**: Shows classes scheduled for the current day
- **Course Details**: Provides information about instructors, schedules, and locations
- **Calendar View**: Visualizes the weekly/monthly schedule

## 4. Security Features

- **Location Validation**: Verifies student is within proximity of the classroom
- **Time-based Validation**: Ensures attendance is recorded during valid class times
- **Anti-Spoofing Measures**: Prevents fake check-ins through signature verification
- **Random Verification Prompts**: Periodically prompts students to confirm presence during class

## 5. User Account Management

- **Authentication**: Secure login with university credentials
- **Profile Management**: View and update user information
- **University Selection**: Choose from available universities
- **Theme Preferences**: Toggle between light and dark mode
- **Password Management**: Change password functionality

## 6. Offline Support

- **Data Persistence**: Stores attendance records locally
- **Sync Capability**: Designed to sync with server when connection is available (future implementation)