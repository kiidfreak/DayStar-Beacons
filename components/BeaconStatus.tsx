import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBeacon } from '@/hooks/useBeacon';
import { useThemeStore } from '@/store/themeStore';

export const BeaconStatus = () => {
  const { 
    isScanning, 
    error, 
    isConnected, 
    attendanceMarked, 
    currentSession,
    beacons,
    startContinuousScanning,
    stopContinuousScanning,
    requestBluetoothPermissions,
    isConnecting, // <-- add this
    setIsConnecting, // <-- add this
    connectedBeaconId, // <-- add this
    checkBeaconSessionAndMarkAttendance, // <-- add this
  } = useBeacon();
  const { themeColors } = useThemeStore();

  // Fallback colors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#F7F9FC',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#00AEEF',
    secondary: '#3DDAB4',
    border: '#E8ECF4',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    inactive: '#C5C6C7',
    highlight: '#E6F7FE',
  };

  const getStatusText = () => {
    if (attendanceMarked) return 'Attendance Marked!';
    if (isConnected) return 'Connected to Beacon';
    if (isScanning) return `Scanning for Beacons... (${beacons.length} found)`;
    if (error) return 'Scan Error';
    return 'Ready to Scan';
  };

  const getStatusColor = () => {
    if (attendanceMarked) return colors.success;
    if (isConnected) return colors.primary;
    if (isScanning) return colors.warning;
    if (error) return colors.error;
    return colors.inactive;
  };

  const getStatusIcon = () => {
    if (attendanceMarked) return 'check-circle';
    if (isConnected) return 'bluetooth-connect';
    if (isScanning) return 'bluetooth';
    if (error) return 'alert-circle';
    return 'bluetooth';
  };

  const handleStartScan = () => {
    console.log('🔘 Manual scan button pressed');
    if (!isScanning) {
      startContinuousScanning();
    }
  };

  const handleRequestPermissions = () => {
    console.log('🔘 Permission request button pressed');
    requestBluetoothPermissions();
  };

  // Handler to stop scanning, mark attendance, then resume scanning
  const handleMarkAttendance = async (macAddress: string) => {
    console.log('🔘 Mark Attendance pressed for:', macAddress);
    stopContinuousScanning();
    setIsConnecting(true);
    console.log('🟢 Calling checkBeaconSessionAndMarkAttendance for:', macAddress);
    await checkBeaconSessionAndMarkAttendance(macAddress);
    console.log('✅ Finished checkBeaconSessionAndMarkAttendance for:', macAddress);
    setIsConnecting(false);
    startContinuousScanning();
  };

  console.log('📊 BeaconStatus render - isScanning:', isScanning, 'error:', error, 'beacons:', beacons.length, 'attendanceMarked:', attendanceMarked);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name={getStatusIcon()} 
          size={24} 
          color={getStatusColor()} 
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Beacon Status
        </Text>
      </View>

      <Text style={[styles.status, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
          {error.includes('authorized') || error.includes('permission') ? (
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermissions}
            >
              <MaterialCommunityIcons 
                name="shield-check" 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.permissionButtonText}>
                Grant Permissions
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Show found beacons */}
      {beacons.length > 0 && (
        <View style={styles.beaconsList}>
          <Text style={[styles.beaconsTitle, { color: colors.text }]}>
            Found Devices ({beacons.length}):
          </Text>
          {beacons.map((beacon, index) => (
            <View key={beacon.id} style={[styles.beaconItem, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons 
                name="bluetooth" 
                size={16} 
                color={colors.primary} 
              />
              <Text style={[styles.beaconName, { color: colors.text }]}>
                {beacon.name && beacon.name !== 'Unknown Device' ? beacon.name : 'BLE Beacon'}
              </Text>
              <Text style={[styles.beaconId, { color: colors.textSecondary }]}>
                {beacon.macAddress}
              </Text>
              {attendanceMarked ? (
                <Text style={{ color: colors.success, marginLeft: 8 }}>Attendance already recorded for this session</Text>
              ) : (
                <TouchableOpacity
                  style={[styles.connectButton, { backgroundColor: colors.primary, marginLeft: 8, opacity: isConnecting ? 0.6 : 1 }]}
                  onPress={() => handleMarkAttendance(beacon.macAddress)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialCommunityIcons name="bluetooth-connect" size={16} color="#FFF" />
                  )}
                  <Text style={{ color: '#FFF', marginLeft: 4 }}>{isConnecting ? 'Marking...' : 'Mark Attendance'}</Text>
                </TouchableOpacity>
              )}
              {connectedBeaconId === beacon.id && (
                <Text style={{ color: colors.success, marginLeft: 8 }}>Connected</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {currentSession && (
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
            Active Session: {currentSession.course_id}
          </Text>
        </View>
      )}

      {/* Manual scan button */}
      {!isScanning && !attendanceMarked && !error && (
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={handleStartScan}
        >
          <MaterialCommunityIcons 
            name="bluetooth" 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.scanButtonText}>
            Start Scanning
          </Text>
        </TouchableOpacity>
      )}

      {attendanceMarked && (
        <View style={[styles.successMessage, { backgroundColor: colors.success }]}>
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          <Text style={styles.successText}>
            Attendance recorded successfully!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  error: {
    fontSize: 12,
    marginRight: 8,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  beaconsList: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  beaconsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1A1D1F',
  },
  beaconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  beaconName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    color: '#1A1D1F',
  },
  beaconId: {
    fontSize: 11,
    marginLeft: 8,
    color: '#6C7072',
    fontFamily: 'monospace',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
});