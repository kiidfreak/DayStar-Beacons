import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/authStore';

interface QRData {
  type: string;
  courseId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  sessionId: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  details?: {
    timeValid: boolean;
    locationValid: boolean;
    signatureValid: boolean;
    courseFound: boolean;
    locationSkipped?: boolean;
  };
}

export default function QRScannerScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const { courses, logAttendance } = useAttendanceStore();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission({ status } as Location.LocationPermissionResponse);
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        setLocationError('Location permission denied. Location validation will be skipped.');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Failed to request location permission. Location validation will be skipped.');
    }
  };
  
  const getCurrentLocation = async (retryAttempt: number = 0) => {
    try {
      setLocationError(null);
      
      // Try different accuracy levels based on retry attempt
      const accuracyLevels = [
        Location.Accuracy.High,
        Location.Accuracy.Balanced,
        Location.Accuracy.Low,
        Location.Accuracy.Lowest
      ];
      
      const accuracy = accuracyLevels[Math.min(retryAttempt, accuracyLevels.length - 1)];
      
      const location = await Location.getCurrentPositionAsync({
        accuracy,
      });
      
      setCurrentLocation(location);
      setLocationRetryCount(0);
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Handle different types of location errors
      let errorMessage = 'Unable to get your location. ';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorMessage += 'Location request timed out. ';
        } else if (error.message.includes('denied') || error.message.includes('PERMISSION_DENIED')) {
          errorMessage += 'Location permission was denied. ';
        } else if (error.message.includes('unavailable') || error.message.includes('POSITION_UNAVAILABLE')) {
          errorMessage += 'Location services are unavailable. ';
        } else {
          errorMessage += 'Location error occurred. ';
        }
      }
      
      // Retry logic
      if (retryAttempt < 3) {
        errorMessage += `Retrying with lower accuracy... (${retryAttempt + 1}/3)`;
        setLocationError(errorMessage);
        setLocationRetryCount(retryAttempt + 1);
        
        // Retry after a delay
        setTimeout(() => {
          getCurrentLocation(retryAttempt + 1);
        }, 2000);
      } else {
        errorMessage += 'Location validation will be skipped.';
        setLocationError(errorMessage);
      }
    }
  };
  
  // Calculate distance between two coordinates in meters
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
  };
  
  // Mock signature validation (in real app, this would use proper cryptographic verification)
  const validateSignature = (data: QRData): boolean => {
    // Simple mock validation - in real app, use HMAC or digital signatures
    const expectedSignature = `${data.courseId}-${data.timestamp}-${data.expiresAt}`.split('').reverse().join('');
    return data.signature === expectedSignature;
  };
  
  // Comprehensive QR code validation with improved error handling
  const validateQRCode = async (qrData: QRData): Promise<ValidationResult> => {
    const now = Date.now();
    const details = {
      timeValid: false,
      locationValid: false,
      signatureValid: false,
      courseFound: false,
      locationSkipped: false,
    };
    
    // 1. Check if QR code has expired (5 minutes validity)
    details.timeValid = now >= qrData.timestamp && now <= qrData.expiresAt;
    if (!details.timeValid) {
      const timeRemaining = Math.max(0, qrData.expiresAt - now);
      const minutesRemaining = Math.floor(timeRemaining / 60000);
      
      if (timeRemaining > 0) {
        return {
          success: false,
          message: `QR code expires in ${minutesRemaining} minutes. Please wait for the instructor to generate a new code.`,
          details
        };
      } else {
        return {
          success: false,
          message: "QR code has expired. Please request a new one from your instructor.",
          details
        };
      }
    }
    
    // 2. Validate signature to prevent tampering
    details.signatureValid = validateSignature(qrData);
    if (!details.signatureValid) {
      return {
        success: false,
        message: "Invalid QR code. This code may have been tampered with or is not from an authorized source.",
        details
      };
    }
    
    // 3. Check if course exists
    const course = courses.find(c => c.id === qrData.courseId);
    details.courseFound = !!course;
    if (!course) {
      return {
        success: false,
        message: "Course not found. Please contact your instructor to verify the QR code.",
        details
      };
    }
    
    // 4. Validate location if available
    if (currentLocation && course.location && !locationError) {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        JSON.parse(course.location).latitude,
        JSON.parse(course.location).longitude
      );
      
      // Allow 100 meter radius for classroom location
      details.locationValid = distance <= 100;
      if (!details.locationValid) {
        return {
          success: false,
          message: `You must be within 100 meters of the classroom to check in. Current distance: ${Math.round(distance)}m. Please move closer to the classroom.`,
          details
        };
      }
    } else {
      // Skip location validation if location is unavailable
      details.locationValid = true;
      details.locationSkipped = true;
    }
    
    return {
      success: true,
      message: `Successfully checked in to ${course.name}${details.locationSkipped ? ' (location validation skipped)' : ''}`,
      details
    };
  };
  
  // Handle QR code scanning with improved error handling
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setIsValidating(true);
    
    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    try {
      // Parse QR code data
      const qrData: QRData = JSON.parse(data);
      
      // Validate required fields
      if (!qrData.type || !qrData.courseId || !qrData.timestamp || !qrData.expiresAt || !qrData.signature || !qrData.sessionId) {
        throw new Error('Invalid QR code format: missing required fields');
      }
      
      // Validate the QR code
      const validation = await validateQRCode(qrData);
      setScanResult(validation);
      
      if (validation.success) {
        // Success haptic
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Log attendance
        const course = courses.find(c => c.id === qrData.courseId);
        if (course) {
          if (!user) return;
          const now = new Date();
          logAttendance({
            sessionId: qrData.sessionId,
            studentId: user.id,
            method: 'QR',
            createdAt: now.toISOString(),
            courseName: course.name,
            courseCode: course.code,
            date: now.toISOString().split('T')[0],
            checkInTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
            status: 'verified',
            latitude: currentLocation?.coords.latitude,
            longitude: currentLocation?.coords.longitude,
          });
        }
        
        // Navigate back after delay
        setTimeout(() => {
          router.back();
        }, 2500);
      } else {
        // Error haptic
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      
      let errorMessage = "Invalid QR code format. ";
      
      if (error instanceof SyntaxError) {
        errorMessage += "The QR code does not contain valid attendance data.";
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please scan a valid attendance QR code from your instructor.";
      }
      
      setScanResult({
        success: false,
        message: errorMessage,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsValidating(false);
    }
  };
  
  // Request camera permission if not granted
  if (!cameraPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }
  
  if (!cameraPermission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons.Button
          name="qrcode-scan"
          size={64}
          color={colors.primary}
          onPress={requestCameraPermission}
        />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          We need camera access to scan QR codes for secure attendance verification
        </Text>
        <Button
          title="Grant Camera Permission"
          onPress={requestCameraPermission}
          variant="primary"
          size="medium"
          style={styles.permissionButton}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS !== 'web' ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          
          <View style={styles.overlay}>
            <View style={styles.scannerFrame} />
            
            <Text style={styles.instructions}>
              Position the QR code within the frame
            </Text>
            
            <Card style={styles.securityInfo}>
              <View style={styles.securityHeader}>
                <MaterialCommunityIcons.Button
                  name="shield"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.securityTitle, { color: colors.primary }]}>
                  Secure Scanning
                </Text>
              </View>
              <Text style={[styles.securityText, { color: colors.text }]}>
                • Time-based validation
              </Text>
              <Text style={[styles.securityText, { color: colors.text }]}>
                • Location verification {locationError ? '(skipped)' : ''}
              </Text>
              <Text style={[styles.securityText, { color: colors.text }]}>
                • Anti-tampering protection
              </Text>
            </Card>
            
            {locationError && (
              <Card style={styles.locationWarning}>
                <View style={styles.warningHeader}>
                  <MaterialCommunityIcons.Button
                    name="alert-circle"
                    size={24}
                    color={colors.warning}
                  />
                  <Text style={[styles.warningTitle, { color: colors.warning }]}>
                    Location Warning
                  </Text>
                </View>
                <Text style={[styles.warningText, { color: colors.text }]}>
                  {locationError}
                </Text>
                {locationRetryCount > 0 && (
                  <Button
                    title="Retry Location"
                    onPress={() => getCurrentLocation()}
                    variant="outline"
                    size="small"
                    style={styles.retryButton}
                  />
                )}
              </Card>
            )}
            
            {isValidating && (
              <Card style={styles.validatingCard}>
                <Text style={[styles.validatingText, { color: colors.primary }]}>
                  Validating QR code...
                </Text>
              </Card>
            )}
            
            {scanResult && (
              <Card style={StyleSheet.flatten([
                styles.resultContainer,
                scanResult.success ? styles.successResult : styles.errorResult
              ])}>
                <View style={styles.resultHeader}>
                  {scanResult.success ? (
                    <MaterialCommunityIcons.Button
                      name="check"
                      size={24}
                      color={colors.success}
                    />
                  ) : (
                    <MaterialCommunityIcons.Button
                      name="close"
                      size={24}
                      color={colors.error}
                    />
                  )}
                  <Text style={[
                    styles.resultText,
                    { color: scanResult.success ? colors.success : colors.error }
                  ]}>
                    {scanResult.message}
                  </Text>
                </View>
                
                {scanResult.details && (
                  <View style={styles.validationDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons.Button
                        name="clock"
                        size={14}
                        color={scanResult.details.timeValid ? colors.success : colors.error}
                      />
                      <Text style={[styles.detailText, { 
                        color: scanResult.details.timeValid ? colors.success : colors.error 
                      }]}>
                        Time validation: {scanResult.details.timeValid ? 'Valid' : 'Expired'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons.Button
                        name="map-marker"
                        size={14}
                        color={scanResult.details.locationValid ? colors.success : colors.error}
                      />
                      <Text style={[styles.detailText, { 
                        color: scanResult.details.locationValid ? colors.success : colors.error 
                      }]}>
                        Location: {scanResult.details.locationSkipped ? 'Skipped' : scanResult.details.locationValid ? 'Valid' : 'Too far'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons.Button
                        name="shield"
                        size={14}
                        color={scanResult.details.signatureValid ? colors.success : colors.error}
                      />
                      <Text style={[styles.detailText, { 
                        color: scanResult.details.signatureValid ? colors.success : colors.error 
                      }]}>
                        Security: {scanResult.details.signatureValid ? 'Valid' : 'Invalid'}
                      </Text>
                    </View>
                  </View>
                )}
              </Card>
            )}
            
            {scanned && !scanResult?.success && !isValidating && (
              <Button
                title="Scan Again"
                onPress={() => {
                  setScanned(false);
                  setScanResult(null);
                }}
                variant="primary"
                size="medium"
                style={styles.scanAgainButton}
              />
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons.Button
                name="close"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.webFallback}>
          <MaterialCommunityIcons.Button
            name="qrcode"
            size={64}
            color={colors.primary}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  permissionButton: {
    marginTop: 24,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  securityInfo: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    minWidth: 250,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationWarning: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    minWidth: 280,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  validatingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  validatingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 280,
  },
  successResult: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  errorResult: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  validationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scanAgainButton: {
    marginBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  webFallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  webBackButton: {
    minWidth: 150,
  },
});