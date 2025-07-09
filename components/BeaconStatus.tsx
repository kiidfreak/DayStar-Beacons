import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    if (isConnected) return 'bluetooth-connected';
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
                {beacon.name || 'Unknown Device'}
              </Text>
              <Text style={[styles.beaconId, { color: colors.textSecondary }]}>
                {beacon.macAddress}
              </Text>
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
    marginBottom: 12,
  },
  beaconsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  beaconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  beaconName: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  beaconId: {
    fontSize: 10,
    marginLeft: 6,
  },
});