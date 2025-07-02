# University Attendance Tracking System Documentation

## System Overview

The University Attendance Tracking System is a mobile application designed to automate and secure the process of tracking student attendance in university courses. The system uses a combination of Bluetooth Low Energy (BLE) beacons and QR code scanning to verify student presence in classrooms, with additional security measures including location validation, time-based verification, and anti-tampering mechanisms.

### Core Purpose

The application addresses several key challenges in traditional attendance tracking:

1. **Accuracy**: Eliminates proxy attendance by requiring physical presence verification
2. **Efficiency**: Automates the attendance process, reducing administrative overhead
3. **Security**: Implements multiple validation layers to prevent attendance fraud
4. **Convenience**: Provides students with real-time attendance status and history

### Target Users

- **Students**: Primary app users who check in to classes
- **Instructors**: Generate QR codes and monitor attendance (future feature)
- **Administrators**: Configure courses and review attendance data (future feature)

### Key Technologies

- **React Native & Expo**: Cross-platform mobile development framework
- **Bluetooth Low Energy (BLE)**: For automatic proximity-based attendance
- **QR Code Scanning**: Alternative check-in method with security features
- **Location Services**: Validates student presence in the correct classroom
- **Zustand**: State management with persistence
- **Expo Router**: Navigation and routing system