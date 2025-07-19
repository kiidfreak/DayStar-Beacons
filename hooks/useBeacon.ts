import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, ToastAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';

interface BeaconData {
  id: string;
  macAddress: string;
  name: string;
  rssi: number;
  timestamp: number;
}

interface BeaconSession {
  id: string;
  beacon_id: string;
  course_id: string;
  start_time: string;
  end_time: string;
  session_date: string;
}

// Create a singleton BleManager instance
//let bleManager: BleManager|any = new BleManager();
//let isInitialized = false;

/* const getBleManager = () => {
  if (!bleManager || !isInitialized) {
    console.log('🔧 Creating new BleManager instance');
    try {
      bleManager = new BleManager();
      isInitialized = true;
      console.log('🔧 BleManager created successfully');
    } catch (error) {
      console.error('❌ Error creating BleManager:', error);
      return null;
    }
  }
  return bleManager;
}; */

export const useBeacon = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [currentSession, setCurrentSession] = useState<BeaconSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [registeredBeaconMacs, setRegisteredBeaconMacs] = useState<Set<string>>(new Set());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedBeaconId, setConnectedBeaconId] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const { markAttendance } = useAttendanceStore();
  
  const scanTimeoutRef = useRef<number | null>(null);
  const sessionCheckIntervalRef = useRef<number | null>(null);
  const continuousScanRef = useRef<number | null>(null);

  // Get the BleManager instance
  const manager = new BleManager();

  // Fetch registered beacon MAC addresses for enrolled courses on mount
  useEffect(() => {
    const fetchAssignedBeacons = async () => {
      if (!user) return;
      // Step 1: Get enrolled course IDs
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'active');
      if (enrollmentsError || !enrollments || enrollments.length === 0) {
        setRegisteredBeaconMacs(new Set());
        setError('Please enroll in a course first.');
        return;
      }
      const courseIds = enrollments.map(e => e.course_id);
      // Step 2: Get assigned beacon MACs for those courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from('beacon_assignments')
        .select('beacon:ble_beacons(mac_address)')
        .in('course_id', courseIds);
      if (assignmentsError || !assignments) {
        setRegisteredBeaconMacs(new Set());
        setError('No beacons assigned to your courses.');
        return;
      }
      const macs = (assignments || [])
        .map(a => {
          const beacon = a.beacon as { mac_address?: string } | null;
          return beacon && typeof beacon.mac_address === 'string'
            ? beacon.mac_address.toUpperCase()
            : undefined;
        })
        .filter((mac): mac is string => Boolean(mac));
      setRegisteredBeaconMacs(new Set(macs));
      // Debug: print the MACs loaded from assignments
      console.log('DEBUG: Registered MACs from beacon_assignments:', macs);
    };
    fetchAssignedBeacons();
  }, [user]);

  // Request Bluetooth permissions
  const requestBluetoothPermissions = useCallback(async () => {
    console.log('🔐 Requesting Bluetooth permissions...');
    
    if (Platform.OS === 'android') {
      try {
        // Request location permission (required for Bluetooth scanning on Android)
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location permission to scan for Bluetooth devices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        console.log('🔐 Location permission result:', locationGranted);
        
        if (locationGranted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Location permission granted');
          
          // Android 12+ (API 31+) requires additional Bluetooth permissions
          if (Platform.Version >= 31) {
            try {
              const bluetoothScanGranted = await PermissionsAndroid.request(
                'android.permission.BLUETOOTH_SCAN',
                {
                  title: 'Bluetooth Scan Permission',
                  message: 'This app needs Bluetooth scan permission to detect attendance beacons.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              console.log('🔐 BLUETOOTH_SCAN permission result:', bluetoothScanGranted);
              const bluetoothConnectGranted = await PermissionsAndroid.request(
                'android.permission.BLUETOOTH_CONNECT',
                {
                  title: 'Bluetooth Connect Permission',
                  message: 'This app needs Bluetooth connect permission to interact with beacons.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              console.log('🔐 BLUETOOTH_CONNECT permission result:', bluetoothConnectGranted);
              const bluetoothAdvertiseGranted = await PermissionsAndroid.request(
                'android.permission.BLUETOOTH_ADVERTISE',
                {
                  title: 'Bluetooth Advertise Permission',
                  message: 'This app needs Bluetooth advertise permission for BLE operations.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              console.log('🔐 BLUETOOTH_ADVERTISE permission result:', bluetoothAdvertiseGranted);
            } catch (bluetoothError) {
              console.log('⚠️ Bluetooth 12+ permissions not available:', bluetoothError);
            }
          }
          
          setPermissionGranted(true);
          return true;
        } else {
          console.log('❌ Location permission denied');
          setError('Location permission is required for Bluetooth scanning');
          return false;
        }
      } catch (err) {
        console.error('❌ Permission request error:', err);
        setError('Failed to request Bluetooth permission');
        return false;
      }
    } else {
      // iOS handles permissions differently
      console.log('📱 iOS - setting permission granted');
      setPermissionGranted(true);
      return true;
    }
  }, []);

  // Initialize Bluetooth manager and start scanning when authenticated and MACs are loaded
  useEffect(() => {
    console.log('🔧 Initializing Bluetooth manager');
    // Start scanning automatically when user is authenticated and MACs are loaded
    if (user && !isScanning && registeredBeaconMacs.size > 0) {
      console.log('🔧 User authenticated and MACs loaded, starting automatic scanning');
      // Delay the start to avoid dependency issues
      setTimeout(() => {
        if (user && !isScanning && registeredBeaconMacs.size > 0) {
          startContinuousScanning();
        }
      }, 1000);
    }
    return () => {
      console.log('🔧 Cleaning up Bluetooth manager');
      if (continuousScanRef.current) {
        clearInterval(continuousScanRef.current);
      }
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [user, isScanning, registeredBeaconMacs]);

  // Start continuous scanning for beacons
  const startContinuousScanning = useCallback(async () => {
    // Commented out most debug logs for cleaner production
    // console.log('🔍 startContinuousScanning called');
    // console.log('🔍 User state:', !!user, 'User ID:', user?.id);
    // console.log('🔍 Permission granted:', permissionGranted);
    // console.log('🔍 Current scanning state:', isScanning);
    // console.log('🔍 Current attendance marked:', attendanceMarked);

    if (!user) {
      console.log('❌ User not authenticated, skipping beacon scan');
      return;
    }

    // Fetch enrolled courses for the user
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_course_enrollments')
      .select('course_id')
      .eq('student_id', user.id)
      .eq('status', 'active');
    if (enrollmentsError || !enrollments || enrollments.length === 0) {
      setError('Please enroll in a course first.');
      setBeacons([]);
      return;
    }

    // Check if location services are enabled (required for BLE scan on Android)
    if (Platform.OS === 'android') {
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        Alert.alert(
          'Enable Location Services',
          'Location services (GPS) must be enabled to scan for Bluetooth beacons. Please enable location services in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setError('Location services (GPS) must be enabled for BLE scanning.');
        return;
      }
    }

    if (!manager) {
      console.log('❌ BleManager not initialized');
      setError('Bluetooth manager not available');
      return;
    }

    // Check Bluetooth state first
    try {
      console.log('🔵 Checking Bluetooth state...');
      const state = await manager.state();
      console.log('🔵 Bluetooth state:', state);
      
      if (state !== 'PoweredOn') {
        console.log('❌ Bluetooth not powered on, current state:', state);
        setError(`Bluetooth not ready. State: ${state}. Please enable Bluetooth on your device.`);
        return;
      }
      
      // Bluetooth is ready for scanning
      console.log('✅ Bluetooth is ready for scanning');
    } catch (error) {
      console.error('❌ Error checking Bluetooth state:', error);
      setError('Failed to check Bluetooth state. Please ensure Bluetooth is enabled.');
      return;
    }

    if (!permissionGranted) {
      console.log('🔐 Requesting Bluetooth permissions...');
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        console.log('❌ Bluetooth permission denied');
        Alert.alert(
          'Permission Required',
          'Bluetooth permission is required to detect attendance beacons.',
          [{ text: 'OK' }]
        );
        return;
      }
      console.log('✅ Bluetooth permission granted');
    }

    // Reset attendance state
    console.log('🔄 Resetting beacon states...');
    setAttendanceMarked(false);
    setCurrentSession(null);
    setError(null);
    setIsScanning(true);
    setBeacons([]); // Clear previous beacons

    console.log('🚀 Starting continuous beacon scanning...');

    try {
      // Commented out most scan debug logs
      // console.log('📡 Starting device scan with manager...');
      // Start scanning
      if (!manager) {
        console.log('❌ BleManager not available for scanning');
        setError('Bluetooth manager not available');
        setIsScanning(false);
        return;
      }
      
      manager.startDeviceScan(
        null, // null means scan for all devices
        { 
          allowDuplicates: false,
          scanMode: 2, // SCAN_MODE_LOW_LATENCY
        },
        (scanError: any, device: any) => {
          // Commented out most scan debug logs
          // console.log('📱 Device scan callback triggered');
          if (scanError) {
            // Improved error logging: include error.reason if available
            console.log('📱 Scan error:', scanError, scanError?.reason);
            console.error('❌ Beacon scan error:', scanError, scanError?.reason);
            // In BLE scan error handling (startDeviceScan), improve error message for throttling
            if (scanError.reason) {
              Toast.show({
                type: 'error',
                text1: 'Beacon scan error',
                text2: `BLE scan failed: ${scanError.reason}`,
              });
            } else if (scanError.message && scanError.message.includes('Undocumented scan throttle')) {
              Toast.show({
                type: 'info',
                text1: 'Beacon scan throttled',
                text2: 'Bluetooth scanning is temporarily throttled by your device. Please wait a few minutes and try again.',
              });
            } else if (scanError.message && scanError.message.includes('Unknown error occurred')) {
              Toast.show({
                type: 'error',
                text1: 'Beacon scan error',
                text2: 'Bluetooth scan failed due to an unknown error. Please ensure all permissions are granted, location services are enabled, and try restarting the app.',
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Beacon scan error',
                text2: scanError.message || scanError.toString() || 'Beacon scan failed',
              });
            }
            return;
          }
          // Commented out most scan debug logs
          // console.log('📱 Device found:', device?.name, device?.id);
          // console.log('📱 Device RSSI:', device?.rssi);
          // console.log('📱 Device isConnectable:', device?.isConnectable);
          
          if (device) {
            const mac = (device.id || '').toUpperCase();
            // Debug: print scanned and registered MACs
            if (!registeredBeaconMacs.has(mac)) {
              // Only log unregistered devices occasionally to reduce spam
              if (Math.random() < 0.1) { // 10% chance to log
                console.log('⛔ Device not registered:', mac);
              }
              return;
            }
            console.log('✅ Found device:', device.name || 'Unknown', device.id);
            const beaconData: BeaconData = {
              id: device.id,
              macAddress: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi || 0,
              timestamp: Date.now(),
            };

            console.log('📝 Adding beacon data:', beaconData);
            setBeacons(prev => {
              const existing = prev.find(b => b.id === beaconData.id);
              if (existing) {
                console.log('🔄 Updating existing beacon');
                return prev.map(b => b.id === beaconData.id ? beaconData : b);
              }
              console.log('➕ Adding new beacon');
              return [...prev, beaconData];
            });
            // (No auto-connect here)
          } else {
            console.log('⚠️ Device callback but no device data');
          }
        }
      );

      console.log('⏰ Setting up continuous scan interval...');
      // Keep scanning until attendance is marked or manually stopped
      continuousScanRef.current = setInterval(() => {
        // Commented out most session/attendance debug logs
        // console.log('⏰ Continuous scan interval check - attendance marked:', attendanceMarked);
        if (attendanceMarked) {
          console.log('✅ Attendance marked, stopping continuous scan');
          stopContinuousScanning();
        }
      }, 30000); // Check every 30 seconds

      console.log('✅ Continuous scanning setup complete');

    } catch (err) {
      console.error('❌ Error starting continuous beacon scan:', err);
      setError('Failed to start beacon scanning');
      setIsScanning(false);
    }
  }, [user, permissionGranted, requestBluetoothPermissions, attendanceMarked, registeredBeaconMacs]);

  // Stop continuous scanning
  const stopContinuousScanning = useCallback(() => {
    console.log('🛑 stopContinuousScanning called');
    console.log('🛑 Current scanning state:', isScanning);
    console.log('🛑 Current attendance marked:', attendanceMarked);
    
    if (!manager) {
      console.log('❌ BleManager not initialized for stopping scan');
      return;
    }
    
    try {
      console.log('📡 Stopping device scan...');
      manager.stopDeviceScan();
      console.log('📡 Device scan stopped');
      
      setIsScanning(false);
      setError(null);
      
      if (continuousScanRef.current) {
        console.log('⏰ Clearing continuous scan interval...');
        clearInterval(continuousScanRef.current);
        continuousScanRef.current = null;
        console.log('⏰ Continuous scan interval cleared');
      }
      
      console.log('✅ Stopped continuous beacon scanning');
    } catch (err) {
      console.error('❌ Error stopping beacon scan:', err);
    }
  }, [isScanning, attendanceMarked, manager]);

  // Connect to a specific device by ID (deprecated, now handled directly)
  // const connectToDevice = useCallback(async (deviceId: string) => {
  //   ... (remove BLE connection logic)
  // });

  // Check if beacon has an active session and mark attendance
  const checkBeaconSessionAndMarkAttendance = async (macAddress: string) => {
    // Add this debug logging to the mobile app's beacon validation function
    console.log('BLE DEBUG: Validating beacon for user:', { macAddress, userId: user?.id });
    try {
      // First, look up the beacon's UUID from the MAC address
      const { data: beacon, error: beaconError } = await supabase
        .from('ble_beacons')
        .select('id')
        .eq('mac_address', macAddress)
        .single();
      if (beaconError || !beacon) {
        console.error('❌ Error fetching beacon UUID:', beaconError);
        setError('Beacon not found');
        return;
      }
      const beaconId = beacon.id;
      // After getting the beacon
      console.log('BLE DEBUG: Beacon found:', beacon);
      // DEBUG: Log beaconId and query params
      console.log('[DEBUG] beaconId:', beaconId, 'macAddress:', macAddress);
      // Get current date and time in UTC
      const now = new Date();
      const nowIso = now.toISOString();
      const today = nowIso.split('T')[0];
      
      // Debug: Log the actual current date
      console.log('📅 DATE DEBUG:');
      console.log(`  - Current Date object: ${now}`);
      console.log(`  - UTC ISO string: ${nowIso}`);
      console.log(`  - Extracted date: ${today}`);
      console.log(`  - Local date: ${now.toLocaleDateString()}`);
      console.log(`  - Local time: ${now.toLocaleTimeString()}`);
      // After getting current time
      console.log('BLE DEBUG: Current time info:', { today, currentTime: now.toTimeString().split(' ')[0], now: now.toISOString() });
      // DEBUG: Show current UTC time and query window
      Toast.show({
        type: 'info',
        text1: 'Debug: Attendance Query',
        text2: `UTC now: ${nowIso.slice(0,19).replace('T',' ')}\nDate: ${today}\nBeacon: ${macAddress}`,
        autoHide: false, // Stays until dismissed
      });
      console.log('[DEBUG] UTC now:', nowIso, 'Date:', today);
      // Get current date and time
      const currentTime = now.toTimeString().split(' ')[0];
      // DEBUG: Log query params
      console.log('[DEBUG] Querying class_sessions with:', {
        beaconId,
        today,
        currentTime
      });
      // Before the session query, add this to see ALL sessions for the beacon today
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('beacon_id', beaconId)
        .eq('session_date', today);

      if (allSessionsError) {
        console.log('BLE DEBUG: Error fetching all sessions:', allSessionsError);
      } else {
        console.log('BLE DEBUG: All sessions for beacon today:', allSessions);
        
        // Log detailed session status analysis
        if (allSessions && allSessions.length > 0) {
          console.log('📊 SESSION STATUS ANALYSIS:');
          allSessions.forEach((session, index) => {
            const now = new Date();
            const windowStart = new Date(session.attendance_window_start);
            const windowEnd = new Date(session.attendance_window_end);
            const isActive = now >= windowStart && now <= windowEnd;
            
            console.log(`Session ${index + 1}:`);
            console.log(`  - ID: ${session.id}`);
            console.log(`  - Location: ${session.location}`);
            console.log(`  - Window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);
            console.log(`  - Current time: ${now.toISOString()}`);
            console.log(`  - Status: ${isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
            console.log(`  - Time until start: ${Math.round((windowStart.getTime() - now.getTime()) / 1000 / 60)} minutes`);
            console.log(`  - Time until end: ${Math.round((windowEnd.getTime() - now.getTime()) / 1000 / 60)} minutes`);
          });
        } else {
          console.log('📊 No sessions found for today');
        }
      }
      // Query for active session
      console.log('[DEBUG] About to query with params:', {
        beaconId,
        today,
        nowIso,
        query: `beacon_id=${beaconId}, session_date=${today}, attendance_window_start>=${nowIso}, attendance_window_end<=${nowIso}`
      });
      const { data: session, error } = await supabase
        .from('class_sessions')
        .select(`id, beacon_id, course_id, start_time, end_time, session_date, attendance_window_start, attendance_window_end`)
        .eq('beacon_id', beaconId)
        .eq('session_date', today)
        .lte('attendance_window_start', nowIso)
        .gte('attendance_window_end', nowIso)
        .maybeSingle();
      // After the main session query
      console.log('BLE DEBUG: Active sessions found:', session ? 1 : 0, session);
      console.log('[DEBUG] Raw query response:', { session, error });
      
      // Log detailed query analysis
      console.log('🔍 QUERY ANALYSIS:');
      console.log(`  - Beacon ID: ${beaconId}`);
      console.log(`  - Date: ${today}`);
      console.log(`  - Current time: ${nowIso}`);
      console.log(`  - Query: attendance_window_start <= ${nowIso} AND attendance_window_end >= ${nowIso}`);
      console.log(`  - Result: ${session ? '✅ FOUND' : '❌ NOT FOUND'}`);
      
      if (session) {
        console.log(`  - Session ID: ${session.id}`);
        console.log(`  - Window: ${session.attendance_window_start} to ${session.attendance_window_end}`);
      }
      
      // Show query result on screen
      Toast.show({
        type: session ? 'success' : 'error',
        text1: session ? 'Session Found!' : 'No Session Found',
        text2: session 
          ? `Session ID: ${session.id}\nWindow: ${session.attendance_window_start} to ${session.attendance_window_end}`
          : `Query params:\nBeacon: ${beaconId}\nDate: ${today}\nTime: ${nowIso}`,
        autoHide: false,
      });
      // Log and toast the full query params
      console.log('[DEBUG] Query params:', {
        beaconId,
        today,
        nowIso,
      });
      Toast.show({
        type: 'info',
        text1: 'Session Query Params',
        text2: `beaconId: ${beaconId}\ntoday: ${today}\nnow: ${nowIso.slice(0,19).replace('T',' ')}\nquery: attendance_window_start>=${nowIso.slice(0,19)} AND attendance_window_end<=${nowIso.slice(0,19)}`,
        autoHide: false,
      });
      // DEBUG: Log session query result
      console.log('[DEBUG] class_sessions query result:', { session, error });
      if (error) {
        // Handle no rows found (PGRST116) with a user notification only
        if (error.code === 'PGRST116') {
          Toast.show({
            type: 'info',
            text1: 'No active session found for this beacon.',
            visibilityTime: 2500,
          });
          setError(null); // Do not propagate error
          return;
        }
        Toast.show({
          type: 'error',
          text1: 'Beacon session error',
          text2: error.message || error.toString() || 'Failed to fetch beacon session',
        });
        setError(error.message || error.toString() || 'Failed to fetch beacon session');
        return;
      }
      if (session) {
        // Log and toast attendance window check
        const nowUtc = new Date().toISOString();
        const inWindow = nowUtc >= session.attendance_window_start && nowUtc <= session.attendance_window_end;
        console.log('[DEBUG] Attendance window check:', {
          nowUtc,
          windowStart: session.attendance_window_start,
          windowEnd: session.attendance_window_end,
          inWindow,
        });
        Toast.show({
          type: inWindow ? 'success' : 'error',
          text1: inWindow ? 'Within Attendance Window' : 'Outside Attendance Window',
          text2: `Now: ${nowUtc.slice(0,19).replace('T',' ')}\nStart: ${session.attendance_window_start}\nEnd: ${session.attendance_window_end}`,
          visibilityTime: 4000,
        });
        if (!inWindow) {
          setIsConnected(false);
          setAttendanceMarked(false);
          return;
        }
        setCurrentSession(session);
        // Mark attendance for this session
        let success = false;
        let error: any = null;
        try {
          success = await markAttendance(session.id, 'beacon');
        } catch (e) {
          error = e;
        }
        if (success) {
          Toast.show({
            type: 'success',
            text1: 'Attendance marked successfully!',
            visibilityTime: 3000,
          });
          setAttendanceMarked(true);
          setIsConnected(true);
        } else if (error && typeof error === 'object' && 'message' in error && error.message.includes('already marked')) {
          // Only show a single info toast, no red error
          Toast.show({
            type: 'info',
            text1: 'Attendance already marked for this session.',
            visibilityTime: 3000,
          });
          setAttendanceMarked(true);
          setIsConnected(true);
        }
      } else {
        // If no session found, fetch all sessions for today for this beacon
        const { data: allSessions, error: allSessionsError } = await supabase
          .from('class_sessions')
          .select('id, attendance_window_start, attendance_window_end, start_time, end_time')
          .eq('beacon_id', beaconId)
          .eq('session_date', today);
        console.log('[DEBUG] All sessions for today:', allSessions);
        Toast.show({
          type: 'info',
          text1: 'All Sessions Today',
          text2: allSessions && allSessions.length > 0
            ? allSessions.map(s => `ID: ${s.id}\nStart: ${s.attendance_window_start}\nEnd: ${s.attendance_window_end}`).join('\n---\n')
            : 'None',
          autoHide: false,
        });
        setIsConnected(false);
        setAttendanceMarked(false);
        console.log('⏰ SESSION ENDED: No active sessions found for beacon');
        console.log('🔄 Resetting beacon connection state');
        Toast.show({
          type: 'info',
          text1: 'Session Ended',
          text2: 'The session has ended. Beacon connection has been reset.',
          visibilityTime: 3500,
        });
      }
    } catch (error) {
      console.error('❌ Error checking beacon session:', error);
      let errorMsg = 'Unknown error occurred while checking beacon session';
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        errorMsg = (error as any).message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error) {
        errorMsg = error.toString();
      }
      setError(errorMsg);
    }
  };

  // Start periodic session checking
  const startSessionChecking = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    sessionCheckIntervalRef.current = setInterval(() => {
      if (beacons.length > 0 && !attendanceMarked) {
        beacons.forEach(beacon => {
          checkBeaconSessionAndMarkAttendance(beacon.macAddress);
        });
      }
    }, 10000); // Check every 10 seconds
  };

  const stopSessionChecking = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    console.log('🔧 useBeacon cleanup effect setup');
    return () => {
      console.log('🔧 useBeacon cleanup effect triggered');
      if (continuousScanRef.current) {
        console.log('🔧 Cleaning up continuous scan interval');
        clearInterval(continuousScanRef.current);
        continuousScanRef.current = null;
      }
      if (sessionCheckIntervalRef.current) {
        console.log('🔧 Cleaning up session check interval');
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      // Don't destroy the manager since it's a singleton
      console.log('🔧 Cleanup complete (manager preserved)');
    };
  }, []); // Empty dependency array to only run on mount/unmount

  return {
    isScanning,
    error,
    permissionGranted,
    isConnected,
    attendanceMarked,
    currentSession,
    beacons,
    startContinuousScanning,
    stopContinuousScanning,
    requestBluetoothPermissions,
    // connectToDevice, // Remove this
    isConnecting,
    setIsConnecting, // Expose this for external use
    connectedBeaconId, // <-- expose this
    checkBeaconSessionAndMarkAttendance, // Expose this for direct use
  };
};