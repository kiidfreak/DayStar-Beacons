# DayStar Beacons

A React Native mobile application for automatic student attendance tracking using BLE beacons and QR codes.

## Features

### Automatic BLE Beacon Attendance Detection
- **Silent Background Detection**: BLE beacons automatically detect student presence without manual intervention
- **Wait Time Enforcement**: Students must remain in the classroom for 2 minutes before attendance is recorded
- **Duplicate Prevention**: Re-entering the room doesn't trigger multiple attendance entries
- **Real-time Presence Tracking**: Monitors student presence and absence in real-time
- **Automatic Session Validation**: Only records attendance during active class sessions

### QR Code Attendance
- Manual QR code scanning for attendance verification
- Secure QR code generation and validation

### User Management
- Student authentication and registration
- Course enrollment management
- University selection and validation

## Technical Implementation

### BLE Beacon System
The app uses a sophisticated presence detection system:

1. **Continuous Scanning**: Background BLE scanning detects registered beacons
2. **Presence Tracking**: Tracks when students enter and leave beacon range
3. **Wait Time Logic**: Enforces a 2-minute minimum presence before recording attendance
4. **Session Validation**: Only records attendance during active class sessions
5. **Duplicate Prevention**: Prevents multiple attendance records for the same session

### Key Components

- `useBeacon.ts`: Core BLE functionality and automatic attendance logic
- `BeaconStatus.tsx`: UI component showing beacon status and presence information
- `attendanceService.ts`: Backend attendance recording and validation

### Database Schema
- `ble_beacons`: Registered beacon devices
- `class_sessions`: Active class sessions with attendance windows
- `student_attendance`: Attendance records with timestamps
- `beacon_assignments`: Beacon-to-course assignments

## Setup and Installation

[Previous setup instructions remain the same...]