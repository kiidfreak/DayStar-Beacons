# Implementation Details

## 1. Authentication System

The authentication system is implemented using Zustand for state management with AsyncStorage persistence.

### Key Components:

- **AuthStore (`store/authStore.ts`)**: Manages authentication state, login/logout functionality, and user data
- **Login Screen (`app/(auth)/login.tsx`)**: Provides the UI for user authentication
- **University Selection (`app/(auth)/select-university.tsx`)**: Allows users to select their institution

### Authentication Flow:

```typescript
// From authStore.ts
login: async (email: string, password: string) => {
  set({ isLoading: true, error: null });
  try {
    const { user, token } = await mockLogin(email, password);
    set({ user, token, isAuthenticated: true, isLoading: false });
  } catch (error) {
    set({ 
      error: error instanceof Error ? error.message : "An unknown error occurred", 
      isLoading: false 
    });
  }
}
```

The current implementation uses a mock login function that accepts predefined credentials (student@uni.edu/password). In a production environment, this would connect to a backend authentication API.

## 2. Attendance Tracking System

The attendance system uses two complementary methods for tracking student presence:

### Bluetooth Beacon Implementation:

The `useBeacon` hook in `hooks/useBeacon.ts` manages the BLE scanning lifecycle:

```typescript
// Simulated beacon scanning (would use actual BLE API in production)
const startScanning = () => {
  if (Platform.OS === 'web') {
    console.log('BLE scanning not supported on web');
    return;
  }
  
  setIsScanning(true);
  setBeaconStatus('scanning');
  
  // Simulate beacon detection after a delay
  setTimeout(() => {
    if (course) {
      setBeaconStatus('detected');
      
      // Simulate connection after another delay
      setTimeout(() => {
        setBeaconStatus('connected');
        setCurrentCourse(course);
        
        // Log attendance
        logAttendance({
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          date: now.toISOString().split('T')[0],
          checkInTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
          status: 'present'
        });
      }, 2000);
    }
  }, 3000);
};
```

In a production environment, this would integrate with the device's BLE API to scan for actual classroom beacons.

### QR Code Scanning Implementation:

The QR scanner (`app/qr-scanner.tsx`) implements a comprehensive validation pipeline:

1. **Camera Integration**: Uses Expo Camera to scan QR codes
2. **Location Services**: Gets current GPS coordinates for location validation
3. **QR Data Parsing**: Extracts and validates the QR code format
4. **Multi-layer Validation**: Checks time validity, location proximity, and cryptographic signature
5. **Attendance Logging**: Records verified attendance in the store

```typescript
// QR code validation pipeline
const validateQRCode = async (qrData: QRData): Promise<ValidationResult> => {
  const now = Date.now();
  const details = {
    timeValid: false,
    locationValid: false,
    signatureValid: false,
    courseFound: false,
    locationSkipped: false,
  };
  
  // Time validation
  details.timeValid = now >= qrData.timestamp && now <= qrData.expiresAt;
  
  // Signature validation
  details.signatureValid = validateSignature(qrData);
  
  // Course validation
  const course = courses.find(c => c.id === qrData.courseId);
  details.courseFound = !!course;
  
  // Location validation
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

## 3. Data Persistence

The application uses Zustand's persist middleware with AsyncStorage for data persistence:

```typescript
// From attendanceStore.ts
export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      // Store state and actions
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

This allows the app to maintain state across app restarts, including:
- User authentication status
- Attendance records
- Course information
- Theme preferences
- University selection

## 4. Theming System

The app implements a flexible theming system with light and dark mode support:

- **ThemeStore (`store/themeStore.ts`)**: Manages theme state and preferences
- **useTheme Hook (`hooks/useTheme.ts`)**: Provides theme colors to components
- **System Theme Detection**: Automatically follows system theme when enabled

```typescript
// From _layout.tsx
useEffect(() => {
  if (isSystemTheme && systemColorScheme) {
    setTheme(systemColorScheme);
  }
}, [systemColorScheme, isSystemTheme]);
```

## 5. Navigation Implementation

The app uses Expo Router for file-based navigation:

```typescript
// From _layout.tsx
function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ 
        title: university?.name || "University",
        headerShown: false,
      }} />
      {/* Other screens */}
    </Stack>
  );
}
```

This creates a consistent navigation experience with proper transitions and header styling.

## 6. Web Compatibility

The application is designed to work on both mobile and web platforms, with appropriate fallbacks:

```typescript
// From qr-scanner.tsx
{Platform.OS !== 'web' ? (
  <CameraView
    style={styles.camera}
    facing="back"
    barcodeScannerSettings={{
      barcodeTypes: ['qr'],
    }}
    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
  >
    {/* Camera UI */}
  </CameraView>
) : (
  <View style={styles.webFallback}>
    <QrCode size={64} color={colors.primary} />
    <Text style={[styles.webFallbackTitle, { color: colors.text }]}>
      Secure QR Scanner
    </Text>
    <Text style={[styles.webFallbackText, { color: colors.textSecondary }]}>
      QR scanning with location validation is not available on web.
      Please use the mobile app for secure attendance verification.
    </Text>
    <Button
      title="Go Back"
      onPress={() => router.back()}
      variant="primary"
      size="medium"
      style={styles.webBackButton}
    />
  </View>
)}
```

Features that rely on native capabilities (like BLE scanning) provide appropriate messaging on web.