import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { BLEService } from '@/services/bleService';
import { DeviceBindingService } from '@/services/deviceBindingService';

export type BeaconStatus = 'scanning' | 'detected' | 'connected' | 'error' | 'inactive';
export type BeaconErrorReason = 'no-session' | 'not-enrolled' | 'outside-window' | 'network-error' | 'device-binding-failed' | null;

export function useBeacon() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [beaconStatus, setBeaconStatus] = useState<BeaconStatus>('inactive');
  const [beaconErrorReason, setLocalBeaconErrorReason] = useState<BeaconErrorReason>(null);
  const { setBeaconStatus: setGlobalBeaconStatus, setCurrentCourse } = useAttendanceStore();
  const { user, deviceBound } = useAuthStore();

  // Start scanning for the current session's beacon
  const startScanning = async () => {
    if (!user) {
      console.log('No user logged in, skipping beacon scan');
      return;
    }

    // Check device binding first
    if (!deviceBound) {
      try {
        console.log('Verifying device binding...');
        const isVerified = await DeviceBindingService.verifyDeviceBinding(user.id);
        if (!isVerified) {
          setBeaconStatus('error');
          setLocalBeaconErrorReason('device-binding-failed');
          Alert.alert(
            'Device Binding Required',
            'Please use your registered device to record attendance.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.error('Device binding verification failed:', error);
        setBeaconStatus('error');
        setLocalBeaconErrorReason('device-binding-failed');
        return;
      }
    }

    try {
      setIsScanning(true);
      setBeaconStatus('scanning');
      setLocalBeaconErrorReason(null);

      // Check BLE support
      const isBLESupported = await BLEService.checkBLESupport();
      if (!isBLESupported) {
        setBeaconStatus('error');
        setLocalBeaconErrorReason('network-error');
        Alert.alert(
          'BLE Not Supported',
          'Bluetooth Low Energy is not supported on this device or permissions are not granted.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start real BLE scanning with student ID
      console.log('Starting BLE beacon scan for student:', user.id);
      const scanResult = await BLEService.startScanning(user.id);

      if (!scanResult.success) {
        setBeaconStatus('error');
        setLocalBeaconErrorReason('network-error');
        console.error('BLE scan failed:', scanResult.error);
        
        if (scanResult.error === 'No enrolled courses found') {
          setLocalBeaconErrorReason('not-enrolled');
          Alert.alert(
            'No Enrolled Courses',
            'You are not enrolled in any courses with active sessions.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      // Check if any beacons are detected
      if (scanResult.beacons.length === 0) {
        console.log('No active beacons found for enrolled courses');
        setBeaconStatus('inactive');
        return;
      }

      // Find the first available beacon (for now, just use the first one)
      const availableBeacon = scanResult.beacons[0];
      console.log('Available beacon detected:', availableBeacon);
      
      if (availableBeacon) {
        setCurrentSession({
          id: availableBeacon.sessionId,
          course: {
            id: availableBeacon.courseId,
            name: availableBeacon.courseName
          }
        });
        setCurrentCourse({
          id: availableBeacon.courseId,
          name: availableBeacon.courseName
        });
        
        setBeaconStatus('detected');
        
        // Simulate connection process
        setTimeout(() => {
          setBeaconStatus('connected');
        }, 1000);
      } else {
        console.log('No suitable beacons found');
        setBeaconStatus('inactive');
      }

    } catch (error) {
      console.error('Beacon scanning error:', error);
      setBeaconStatus('error');
      setLocalBeaconErrorReason('network-error');
    } finally {
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    BLEService.stopScanning();
    setIsScanning(false);
    setBeaconStatus('inactive');
    setCurrentSession(null);
    setLocalBeaconErrorReason(null);
  };

  // Update global beacon status when local status changes
  useEffect(() => {
    setGlobalBeaconStatus(beaconStatus);
  }, [beaconStatus, setGlobalBeaconStatus]);

  return {
    isScanning,
    beaconStatus,
    currentSession,
    startScanning,
    stopScanning,
    beaconErrorReason,
  };
}