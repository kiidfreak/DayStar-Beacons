import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { AttendanceService } from '@/services/attendanceService';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useAuthStore } from '@/store/authStore';

const TEST_STUDENT_ID = 'teststudent';

export function useBeacon() {
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [beaconStatus, setBeaconStatus] = useState<'inactive' | 'scanning' | 'detected' | 'connected' | 'error'>('inactive');
  const bleManager = useRef<BleManager | null>(null);
  const scanningTimeout = useRef<NodeJS.Timeout | null>(null);
  const { setBeaconStatus: setGlobalBeaconStatus } = useAttendanceStore();
  const { user } = useAuthStore();
  const attendanceLoggedRef = useRef(false);

  // Helper: get current session based on time
  const getCurrentSession = (sessions: any[]) => {
    const now = new Date();
    for (const session of sessions) {
      if (!session.startTime || !session.endTime) continue;
      const [startHour, startMinute] = session.startTime.split(':').map(Number);
      const [endHour, endMinute] = session.endTime.split(':').map(Number);
      const start = new Date(now);
      start.setHours(startHour, startMinute, 0, 0);
      const end = new Date(now);
      end.setHours(endHour, endMinute, 59, 999);
      if (now >= start && now <= end) {
        return session;
      }
    }
    return null;
  };

  // Request Android BLE permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      Alert.alert('Permission error', 'Failed to get BLE permissions.');
      return false;
    }
  };

  // Start scanning for the current session's beacon
  const startScanning = async () => {
    if (Platform.OS !== 'android') {
      setBeaconStatus('inactive');
      return;
    }
    setBeaconStatus('scanning');
    setIsScanning(true);
    if (!bleManager.current) bleManager.current = new BleManager();
    try {
      const hasPerm = await requestPermissions();
      if (!hasPerm) {
        setBeaconStatus('error');
        setIsScanning(false);
        return;
      }
      // Hardcoded MAC for testing
      const beaconMac = 'C3:00:00:34:51:EB'.toUpperCase();
      // Get today's sessions for the user
      let sessionId = null;
      if (user) {
        try {
          const sessions = await AttendanceService.getTodaysSessions(user.id);
          // Find the session with a matching beacon MAC
          const session = sessions.find(s => s.beacon && s.beacon.macAddress && s.beacon.macAddress.toUpperCase() === beaconMac);
          if (session) sessionId = session.id;
        } catch (e) {
          console.error('Error fetching sessions for attendance:', e);
        }
      }
      bleManager.current.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          setBeaconStatus('error');
          setIsScanning(false);
          return;
        }
        if (device) {
          console.log('BLE DEBUG: Looking for', beaconMac, 'Found:', device.id, device.name);
        }
        if (device && device.id.toUpperCase() === beaconMac) {
          setBeaconStatus('detected');
          if (!attendanceLoggedRef.current && user && sessionId) {
            attendanceLoggedRef.current = true;
            AttendanceService.recordAttendance(
              sessionId,
              user.id,
              'BLE'
            );
            console.log('Attendance logged for beacon:', beaconMac, 'user:', user.id, 'session:', sessionId);
          }
        }
      });
    } catch (err) {
      setBeaconStatus('error');
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    setBeaconStatus('inactive');
    if (bleManager.current) bleManager.current.stopDeviceScan();
    if (scanningTimeout.current) {
      clearTimeout(scanningTimeout.current);
      scanningTimeout.current = null;
    }
  };

  // Auto-scan when component mounts and every minute
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const checkInterval = setInterval(() => {
      if (!isScanning) {
        startScanning();
      }
    }, 60000);
    // Initial scan
    startScanning();
    return () => {
      clearInterval(checkInterval);
      if (scanningTimeout.current) {
        clearTimeout(scanningTimeout.current);
      }
      if (bleManager.current) {
        bleManager.current.destroy();
        bleManager.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever beaconStatus changes, update the global store
  useEffect(() => {
    setGlobalBeaconStatus(beaconStatus);
  }, [beaconStatus, setGlobalBeaconStatus]);

  // Reset attendanceLoggedRef when scanning starts
  useEffect(() => {
    if (isScanning) attendanceLoggedRef.current = false;
  }, [isScanning]);

  return {
    isScanning,
    beaconStatus,
    currentSession,
    startScanning,
    stopScanning,
  };
}