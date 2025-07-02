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
  const [beaconErrorReason, setBeaconErrorReason] = useState<string | null>(null);
  const bleManager = useRef<BleManager | null>(null);
  const scanningTimeout = useRef<NodeJS.Timeout | null>(null);
  const { setBeaconStatus: setGlobalBeaconStatus, setCurrentCourse } = useAttendanceStore();
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

  // Helper: check if now is within the first 20 minutes of session
  function isWithinAttendanceWindow(session: any) {
    if (!session) return false;
    const now = new Date();
    if (session.attendanceWindowStart && session.attendanceWindowEnd) {
      const windowStart = new Date(session.attendanceWindowStart);
      const windowEnd = new Date(session.attendanceWindowEnd);
      console.log('DEBUG attendance window (ISO):', {
        now: now.toISOString(),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        sessionStartTime: session.startTime,
      });
      return now >= windowStart && now <= windowEnd;
    }
    // Fallback to startTime logic if attendanceWindowStart/End are missing
    if (!session.startTime) return false;
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const attendanceStart = new Date(now);
    attendanceStart.setHours(startHour, startMinute, 0, 0);
    const attendanceEnd = new Date(attendanceStart.getTime() + 20 * 60 * 1000);
    console.log('DEBUG attendance window (fallback):', {
      now: now.toISOString(),
      attendanceStart: attendanceStart.toISOString(),
      attendanceEnd: attendanceEnd.toISOString(),
      sessionStartTime: session.startTime,
    });
    return now >= attendanceStart && now <= attendanceEnd;
  }

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
        setBeaconErrorReason('ble-error');
        setIsScanning(false);
        console.error('BLE ERROR: Permissions not granted');
        return;
      }
      // Hardcoded MAC for testing
      const beaconMac = 'C3:00:00:34:51:EB'.toUpperCase();
      let sessionId = null;
      let selectedSession = null;

      if (user) {
        try {
          const sessions = await AttendanceService.getTodaysSessions(user.id);
          console.log('BLE DEBUG: Sessions fetched for user', user.id, sessions);

          // Find the session with a matching beacon MAC
          selectedSession = sessions.find(
            s =>
              s.beacon &&
              (
                (s.beacon.macAddress && s.beacon.macAddress.toUpperCase() === beaconMac) ||
                ((s.beacon as any).mac_address && (s.beacon as any).mac_address.toUpperCase() === beaconMac)
              )
          );
          console.log('BLE DEBUG: Selected session:', selectedSession);

          if (selectedSession) {
            sessionId = selectedSession.id;
          }
        } catch (e) {
          console.error('Error fetching sessions for attendance:', e);
        }
      }

      if (!sessionId) {
        console.warn('BLE DEBUG: No valid session found for beacon', beaconMac, 'and user', user?.id);
        setCurrentCourse(null);
        setBeaconErrorReason('no-session');
        // Set error status so the UI shows an error state
        setTimeout(() => setBeaconStatus('error'), 500); // short delay to avoid flicker
        return;
      }

      // Ensure BLE manager is initialized right before scanning
      if (!bleManager.current) bleManager.current = new BleManager();
      bleManager.current.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          setBeaconStatus('error');
          setBeaconErrorReason('ble-error');
          setIsScanning(false);
          console.error('BLE ERROR: Device scan error:', error);
          return;
        }
        // if (device) {
        //   console.log('BLE DEBUG: Looking for', beaconMac, 'Found:', device.id, device.name);
        // }
        if (device && device.id.toUpperCase() === beaconMac) {
          setBeaconStatus('detected');
          if (!attendanceLoggedRef.current && user && sessionId) {
            // Check attendance window before logging
            if (!isWithinAttendanceWindow(selectedSession)) {
              // console.warn('BLE DEBUG: Not within attendance window for session:', selectedSession);
              setBeaconStatus('error');
              setBeaconErrorReason('window-closed');
              setIsScanning(false);
              return;
            }
            attendanceLoggedRef.current = true;
            // Set the current course in the global store for UI update
            if (selectedSession && selectedSession.course) {
              setCurrentCourse(selectedSession.course);
            }
            AttendanceService.recordAttendance(
              sessionId,
              user.id,
              'ble'
            );
            console.log('Attendance logged for beacon:', beaconMac, 'user:', user.id, 'session:', sessionId, 'course:', selectedSession?.course?.code || selectedSession?.course?.id || 'unknown');
          }
        }
      });
    } catch (err) {
      setBeaconStatus('error');
      setBeaconErrorReason('ble-error');
      setIsScanning(false);
      console.error('BLE ERROR: Exception in startScanning:', err);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    setBeaconStatus('inactive');
    setCurrentCourse(null);
    setBeaconErrorReason(null);
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
    beaconErrorReason,
  };
}