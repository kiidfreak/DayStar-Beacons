import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { supabase } from '@/lib/supabase';

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
  is_active: boolean;
}

// Create a singleton BleManager instance
let bleManager: BleManager | null = null;
let isInitialized = false;

const getBleManager = () => {
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
};

export const useBeacon = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [beacons, setBeacons] = useState<BeaconData[]>([]);
  const [currentSession, setCurrentSession] = useState<BeaconSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  
  const { user } = useAuthStore();
  const { markAttendance } = useAttendanceStore();
  
  const scanTimeoutRef = useRef<number | null>(null);
  const sessionCheckIntervalRef = useRef<number | null>(null);
  const continuousScanRef = useRef<number | null>(null);

  // Get the BleManager instance
  const manager = getBleManager();

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
          
          // Also request Bluetooth permission if available
          if (Platform.Version >= 31) { // Android 12+
            try {
              const bluetoothGranted = await PermissionsAndroid.request(
                'android.permission.BLUETOOTH_SCAN',
                {
                  title: 'Bluetooth Permission',
                  message: 'This app needs Bluetooth permission to detect attendance beacons.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              console.log('🔐 Bluetooth permission result:', bluetoothGranted);
            } catch (bluetoothError) {
              console.log('⚠️ Bluetooth permission not available:', bluetoothError);
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

  // Initialize Bluetooth manager and start scanning when authenticated
  useEffect(() => {
    console.log('🔧 Initializing Bluetooth manager');
    
    // Start scanning automatically when user is authenticated
    if (user && !isScanning) {
      console.log('🔧 User authenticated, starting automatic scanning');
      // Delay the start to avoid dependency issues
      setTimeout(() => {
        if (user && !isScanning) {
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
  }, [user, isScanning]);

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
        (scanError, device) => {
          console.log('📱 Device scan callback triggered');
          console.log('📱 Scan error:', scanError);
          console.log('📱 Device found:', device?.name, device?.id);
          console.log('📱 Device RSSI:', device?.rssi);
          console.log('📱 Device isConnectable:', device?.isConnectable);
          
          if (scanError) {
            console.error('❌ Beacon scan error:', scanError);
            setError(scanError.message || scanError.toString() || 'Beacon scan failed');
            return;
          }

          if (device) {
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
      }, 5000); // Check every 5 seconds

      console.log('✅ Continuous scanning setup complete');

    } catch (err) {
      console.error('❌ Error starting continuous beacon scan:', err);
      setError('Failed to start beacon scanning');
      setIsScanning(false);
    }
  }, [user, permissionGranted, requestBluetoothPermissions, attendanceMarked]);

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

  // Connect to a specific device by ID
  const connectToDevice = useCallback(async (deviceId: string) => {
    if (!manager) {
      console.log('❌ BleManager not initialized for connectToDevice');
      setError('Bluetooth manager not available');
      return;
    }
    try {
      console.log('🔗 Attempting to connect to device:', deviceId);
      const device = await manager.devices([deviceId]).then(devices => devices[0]);
      if (!device) {
        setError('Device not found');
        return;
      }
      if (device.isConnectable) {
        await device.connect();
        setIsConnected(true);
        console.log('✅ Connected to device:', deviceId);
        // Only after successful connection, check session and mark attendance
        checkBeaconSessionAndMarkAttendance(deviceId);
      } else {
        setError('Device is not connectable');
        console.log('⚠️ Device is not connectable:', deviceId);
      }
    } catch (connectError: any) {
      setError(connectError?.message || connectError?.toString() || 'Failed to connect');
      console.error('❌ Failed to connect to device:', connectError);
    }
  }, [manager]);

  // Check if beacon has an active session and mark attendance
  const checkBeaconSessionAndMarkAttendance = async (macAddress: string) => {
    console.log('🔍 checkBeaconSessionAndMarkAttendance called for:', macAddress);
    
    try {
      console.log('📊 Querying database for beacon session...');
      
      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          beacon_id,
          course_id,
          start_time,
          end_time,
          is_active
        `)
        .eq('beacon_id', macAddress)
        .eq('is_active', true)
        .single();

      console.log('📊 Database query result:', { sessions, error });

      if (error) {
        console.error('❌ Error fetching beacon session:', error);
        setError(error.message || error.toString() || 'Failed to fetch beacon session');
        return;
      }

      if (sessions) {
        console.log('✅ Active session found for beacon:', sessions);
        setCurrentSession(sessions);
        
        console.log('📝 Marking attendance for session:', sessions.id);
        // Mark attendance for this session
        const success = await markAttendance(sessions.id, 'beacon');
        console.log('📝 Attendance marking result:', success);
        
        if (success) {
          console.log('✅ Attendance marked successfully for beacon session');
          setAttendanceMarked(true);
          setIsConnected(true);
        } else {
          console.log('❌ Failed to mark attendance');
        }
      } else {
        console.log('⚠️ No active session found for beacon:', macAddress);
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
    connectToDevice, // <-- expose this
  };
};