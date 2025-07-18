import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

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
    console.log('🔍 startContinuousScanning called');
    console.log('🔍 User state:', !!user, 'User ID:', user?.id);
    console.log('🔍 Permission granted:', permissionGranted);
    console.log('🔍 Current scanning state:', isScanning);
    console.log('🔍 Current attendance marked:', attendanceMarked);

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
      console.log('📡 Starting device scan with manager...');
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
          console.log('📱 Device scan callback triggered');
          if (scanError) {
            // Improved error logging: include error.reason if available
            console.log('📱 Scan error:', scanError, scanError?.reason);
            console.error('❌ Beacon scan error:', scanError, scanError?.reason);
            let userMessage = '';
            if (scanError.reason) {
              userMessage = `BLE scan failed: ${scanError.reason}`;
            } else if (scanError.message && scanError.message.includes('Unknown error occurred')) {
              userMessage = 'Bluetooth scan failed due to an unknown error. Please ensure all permissions are granted, location services are enabled, and try restarting the app.';
            } else {
              userMessage = scanError.message || scanError.toString() || 'Beacon scan failed';
            }
            setError(userMessage);
            return;
          }
          console.log('📱 Device found:', device?.name, device?.id);
          console.log('📱 Device RSSI:', device?.rssi);
          console.log('📱 Device isConnectable:', device?.isConnectable);
          
          if (device) {
            const mac = (device.id || '').toUpperCase();
            // Debug: print scanned and registered MACs
            console.log('DEBUG: Scanned device.id:', mac, 'Registered MACs:', Array.from(registeredBeaconMacs));
            if (!registeredBeaconMacs.has(mac)) {
              console.log('⛔ Device not a registered beacon:', mac);
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
        console.log('⏰ Continuous scan interval check - attendance marked:', attendanceMarked);
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
    console.log('🔍 checkBeaconSessionAndMarkAttendance called for:', macAddress);
    try {
      console.log('📊 Looking up beacon UUID for MAC address...');
      // 1. Find the beacon by MAC address
      const { data: beacon, error: beaconError } = await supabase
        .from('ble_beacons')
        .select('id')
        .eq('mac_address', macAddress)
        .single();
      if (beaconError || !beacon) {
        console.error('❌ Error fetching beacon by MAC address:', beaconError);
        setError('Beacon not found for this MAC address.');
        return;
      }
      // 2. Use beacon.id (UUID) in the class_sessions query
      console.log('📊 Querying database for beacon session with beacon_id:', beacon.id);
      const now = new Date();
      // Extract only the date part for session_date (YYYY-MM-DD)
      const today = now.toISOString().split('T')[0];
      // Extract only the time part for start_time and end_time (HH:mm:ss)
      const currentTime = now.toTimeString().split(' ')[0];
      console.log('🕒 Device current time (ISO):', now.toISOString());
      console.log('🕒 Device current time (local):', now.toLocaleString());
      console.log('🕒 Device current time (HH:mm:ss):', currentTime);
      const { data: session, error } = await supabase
        .from('class_sessions')
        .select(`id, beacon_id, course_id, start_time, end_time, session_date`)
        .eq('beacon_id', beacon.id)
        .eq('session_date', today) // Pass only the date part
        .lte('start_time', currentTime) // Pass only the time part
        .gte('end_time', currentTime) // Pass only the time part
        .maybeSingle(); // <-- allows 0 or 1 result
      console.log('📊 Database query result:', { session, error });
      if (session) {
        console.log('🕒 Session start_time:', session.start_time);
        console.log('🕒 Session end_time:', session.end_time);
        console.log('🕒 Session session_date:', session.session_date);
        // Compare device time to session times
        const sessionStart = session.start_time;
        const sessionEnd = session.end_time;
        console.log('🕒 Comparing device time (', currentTime, ') to session window:', sessionStart, '-', sessionEnd);
      }
      if (error) {
        console.error('❌ Error fetching beacon session:', error);
        setError(error.message || error.toString() || 'Failed to fetch beacon session');
        return;
      }
      if (!session) {
        console.log('⚠️ No active session found for beacon:', macAddress);
        setError('No active session found for this beacon.');
        return;
      }
      if (session) {
        console.log('✅ Active session found for beacon:', session);
        setCurrentSession(session);
        console.log('📝 Marking attendance for session:', session.id, 'session object:', session);
        // Mark attendance for this session
        const success = await markAttendance(session.id, 'beacon');
        console.log('📝 Attendance marking result:', success);
        if (success) {
          console.log('✅ Attendance marked successfully for beacon session');
          setAttendanceMarked(true);
          setIsConnected(true);
          // Insert attendance record into DB
          try {
            // Fetch course_code and course_name from courses table
            let courseCode = null;
            let courseName = null;
            try {
              const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('code, name')
                .eq('id', session.course_id)
                .single();
              if (courseError) {
                console.error('❌ Error fetching course info:', courseError);
              } else if (course) {
                courseCode = course.code;
                courseName = course.name;
              }
            } catch (courseFetchErr) {
              console.error('❌ Exception fetching course info:', courseFetchErr);
            }
            const { data: attendanceInsert, error: attendanceInsertError } = await supabase
              .from('attendance_records')
              .insert([
                {
                  session_id: session.id,
                  student_id: user?.id,
                  method: 'beacon',
                  status: 'present',
                  check_in_time: new Date().toISOString(),
                  course_code: courseCode,
                  course_name: courseName,
                  date: today,
                },
              ]);
            if (attendanceInsertError) {
              console.error('❌ Error inserting attendance record:', attendanceInsertError);
            } else {
              console.log('✅ Attendance record inserted:', attendanceInsert);
            }
          } catch (insertErr) {
            console.error('❌ Exception inserting attendance record:', insertErr);
          }
        } else {
          console.log('❌ Failed to mark attendance');
        }
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