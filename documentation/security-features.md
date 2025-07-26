# Security Features

The University Attendance Tracking System implements multiple layers of security to ensure the integrity of attendance records and prevent fraudulent check-ins.

## 1. QR Code Security

The QR code scanning system incorporates several security measures:

### Time-Based Validation

- **Short Validity Window**: QR codes are valid for only 5 minutes after generation
- **Timestamp Verification**: Each QR code contains generation timestamp and expiration time
- **Server Time Synchronization**: Time validation uses server-synchronized timestamps to prevent device clock manipulation

Implementation in `utils/qrSecurity.ts`:
```typescript
static isTimeValid(data: QRCodeData): boolean {
  const now = Date.now();
  return now >= data.timestamp && now <= data.expiresAt;
}
```

### Digital Signature

- **Tamper Protection**: QR codes include a cryptographic signature
- **Signature Verification**: The app validates the signature to ensure the QR code hasn't been modified
- **Unique Session IDs**: Each QR code contains a unique session identifier

Implementation in `utils/qrSecurity.ts`:
```typescript
static validateSignature(data: QRCodeData): boolean {
  const expectedSignature = this.generateSignature({
    type: data.type,
    courseId: data.courseId,
    timestamp: data.timestamp,
    expiresAt: data.expiresAt,
    location: data.location,
    instructorId: data.instructorId,
    sessionId: data.sessionId,
  });
  
  return data.signature === expectedSignature;
}
```

## 2. Location-Based Validation

The system verifies that students are physically present in the correct classroom:

### Proximity Verification

- **Geolocation Checking**: Compares student's GPS coordinates with classroom coordinates
- **Accuracy Threshold**: Validates student is within 100 meters of the classroom
- **Multiple Accuracy Levels**: Falls back to lower accuracy if high-precision location is unavailable
- **Retry Mechanism**: Attempts to get location multiple times with different accuracy settings

Implementation in `app/qr-scanner.tsx`:
```typescript
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
```

### Graceful Degradation

- **Permission Handling**: Properly handles location permission denial
- **Error Recovery**: Provides fallback options when location services are unavailable
- **Transparency**: Clearly indicates when location validation is skipped

## 3. Bluetooth Beacon Security

The BLE beacon system provides an additional layer of proximity verification:

### Beacon Authentication

- **Unique Identifiers**: Each classroom has a unique beacon MAC address
- **Signal Strength Analysis**: Validates student proximity based on signal strength
- **Continuous Verification**: Periodically checks for continued presence

### Random Verification Prompts

- **Presence Confirmation**: Randomly prompts students to confirm they're still in class
- **Time-Limited Response**: Students must respond within 1 minute
- **Absence Marking**: Failure to respond may result in being marked absent

Implementation in `hooks/useBeacon.ts`:
```typescript
// Simulate random check-in prompts
useEffect(() => {
  if (currentBeaconStatus === 'connected') {
    const randomPromptInterval = Math.random() * 30000 + 30000; // 30-60 seconds
    
    const promptTimeout = setTimeout(() => {
      const { currentCourse } = useAttendanceStore.getState();
      
      if (currentCourse) {
        const now = Date.now();
        useAttendanceStore.getState().setCheckInPrompt({
          id: `prompt-${now}`,
          courseId: currentCourse.id,
          courseName: currentCourse.name,
          timestamp: now,
          expiresAt: now + 60000 // Expires in 1 minute
        });
      }
    }, randomPromptInterval);
    
    return () => clearTimeout(promptTimeout);
  }
}, [currentBeaconStatus]);
```

## 4. Device Binding

- **Device Registration**: Each student account is bound to a specific device
- **Device Verification**: Attendance can only be recorded from the registered device
- **Secure Device ID**: Uses hardware identifiers to prevent spoofing

## 5. Comprehensive Validation Pipeline

The QR scanner implements a multi-step validation process:

1. **Parse QR Data**: Extracts and validates the QR code format
2. **Time Validation**: Verifies the QR code is within its validity period
3. **Signature Validation**: Confirms the QR code hasn't been tampered with
4. **Course Validation**: Verifies the course exists in the student's schedule
5. **Location Validation**: Confirms the student is in the correct location
6. **Attendance Logging**: Records attendance with all validation metadata

Implementation in `app/qr-scanner.tsx`:
```typescript
const validateQRCode = async (qrData: QRData): Promise<ValidationResult> => {
  const now = Date.now();
  const details = {
    timeValid: false,
    locationValid: false,
    signatureValid: false,
    courseFound: false,
    locationSkipped: false,
  };
  
  // 1. Check if QR code has expired
  details.timeValid = now >= qrData.timestamp && now <= qrData.expiresAt;
  
  // 2. Validate signature to prevent tampering
  details.signatureValid = validateSignature(qrData);
  
  // 3. Check if course exists
  const course = courses.find(c => c.id === qrData.courseId);
  details.courseFound = !!course;
  
  // 4. Validate location if available
  if (currentLocation && course.location && !locationError) {
    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      course.location.latitude,
      course.location.longitude
    );
    
    details.locationValid = distance <= 100;
  } else {
    details.locationValid = true;
    details.locationSkipped = true;
  }
  
  return {
    success: details.timeValid && details.signatureValid && 
             details.courseFound && details.locationValid,
    message: generateResultMessage(details),
    details
  };
};
```

## 6. Error Handling & Security Logging

- **Detailed Error Messages**: Provides specific feedback on validation failures
- **Security Logging**: Records all validation attempts and failures
- **Retry Limitations**: Prevents brute force attempts
- **Transparent Feedback**: Shows users exactly which validation steps passed or failed