import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBeacon } from '@/hooks/useBeacon';
import { useThemeStore } from '@/store/themeStore';
import { AttendanceService } from '@/services/attendanceService';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';

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
    // New automatic attendance features
    presenceData,
    automaticAttendanceEnabled,
    setAutomaticAttendanceEnabled,
    waitTimeMinutes,
  } = useBeacon();
  const { themeColors } = useThemeStore();
  const { user } = useAuthStore();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const [showAllBeacons, setShowAllBeacons] = useState(false);
  const [lastSeenBeacon, setLastSeenBeacon] = useState(Date.now());
  const [beaconLostWarned, setBeaconLostWarned] = useState(false);
  const [currentAttendanceRecord, setCurrentAttendanceRecord] = useState<any>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

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
    if (attendanceMarked) return 'Attendance Recorded!';
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

  // Get presence status for display
  const getPresenceStatus = () => {
    if (presenceData.size === 0) return null;
    
    const activePresence = Array.from(presenceData.values()).find(p => p.isPresent);
    if (!activePresence) return null;
    
    const timeInRoom = (Date.now() - activePresence.firstSeen) / (1000 * 60); // minutes
    const remainingTime = Math.max(0, waitTimeMinutes - timeInRoom);
    
    return {
      timeInRoom: Math.floor(timeInRoom),
      remainingTime: Math.ceil(remainingTime),
      waitTimeElapsed: activePresence.waitTimeElapsed,
      attendanceMarked: activePresence.attendanceMarked,
    };
  };

  // Manual attendance handler (kept for backward compatibility but not used in UI)
  const handleMarkAttendance = async (macAddress: string) => {
    console.log('🔘 Manual attendance triggered for:', macAddress);
    // This is now handled automatically by the presence detection system
    // Keeping this function for potential manual override scenarios
  };

  // Check if session is ongoing
  const isSessionOngoing = () => {
    if (!currentSession || !(currentSession as any).end_time) return false;
    const now = new Date();
    const end = new Date((currentSession as any).end_time);
    return now < end;
  };

  // Handle checkout
  const handleCheckOut = () => {
    const sessionId = currentSession?.id || currentAttendanceRecord?.session_id;
    if (!sessionId || !user) return;
    Alert.alert(
      'Check Out',
      'Are you sure you want to check out and log your attendance sign out time?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', style: 'destructive', onPress: () => setPendingCheckout(true) },
      ]
    );
  };

  // Run async checkout after confirmation
  React.useEffect(() => {
    const sessionId = currentSession?.id || currentAttendanceRecord?.session_id;
    if (pendingCheckout) {
      console.log('pendingCheckout effect triggered', { sessionId, user });
    }
    const doCheckout = async () => {
      if (!pendingCheckout || !sessionId || !user) return;
      try {
        await AttendanceService.recordCheckout(sessionId, user.id);
        const record = await AttendanceService.getAttendanceRecord(sessionId, user.id);
        setCurrentAttendanceRecord(record);
        Toast.show({
          type: 'success',
          text1: 'Checked out successfully!',
          visibilityTime: 3000,
        });
      } catch (e) {
        let errorMsg = 'An error occurred while checking out.';
        if (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') {
          errorMsg = (e as any).message;
        }
        console.error('Checkout error:', e);
        Toast.show({
          type: 'error',
          text1: 'Checkout failed',
          text2: errorMsg,
          visibilityTime: 4000,
        });
      } finally {
        setPendingCheckout(false);
      }
    };
    doCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCheckout]);

  // Track last seen beacon time
  React.useEffect(() => {
    if (isConnected) {
      setLastSeenBeacon(Date.now());
      setBeaconLostWarned(false);
    }
  }, [isConnected]);

  // Warn if beacon is lost for >2 minutes
  React.useEffect(() => {
    if (attendanceMarked && !beaconLostWarned) {
      const interval = setInterval(() => {
        if (Date.now() - lastSeenBeacon > 2 * 60 * 1000) {
          setBeaconLostWarned(true);
          Toast.show({
            type: 'info',
            text1: 'We haven’t detected your presence.',
            text2: 'Please check out if you are leaving.',
            visibilityTime: 5000,
          });
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [attendanceMarked, lastSeenBeacon, beaconLostWarned]);

  // Fetch the current attendance record after check-in or on mount if session exists
  React.useEffect(() => {
    const fetchRecord = async () => {
      if (currentSession && user) {
        const record = await AttendanceService.getAttendanceRecord(currentSession.id, user.id);
        setCurrentAttendanceRecord(record);
      }
    };
    fetchRecord();
  }, [currentSession, user, attendanceMarked]);

  console.log('📊 BeaconStatus render - isScanning:', isScanning, 'error:', error, 'beacons:', beacons.length, 'attendanceMarked:', attendanceMarked);

  // Compact beacon list logic
  const MAX_VISIBLE_BEACONS = 3;
  const visibleBeacons = showAllBeacons ? beacons : beacons.slice(0, MAX_VISIBLE_BEACONS);
  const hasMoreBeacons = beacons.length > MAX_VISIBLE_BEACONS;

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

      {/* Scanning indicator - always show when scanning is active */}
      {isScanning && (
        <View style={[styles.scanningIndicator, { backgroundColor: colors.warning }]}> 
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.scanningText, { color: colors.textSecondary, marginLeft: 8 }]}>Scanning for beacons...</Text>
        </View>
      )}

      {/* Show found beacons */}
      {beacons.length > 0 && (
        <View style={styles.beaconsList}>
          <Text style={[styles.beaconsTitle, { color: colors.text }]}>Found Devices ({beacons.length}):</Text>
          {visibleBeacons.map((beacon, index) => {
            // Check if this beacon has presence data
            const beaconPresence = Array.from(presenceData.values()).find(p => 
              p.beaconId === beacon.id || p.beaconId === beacon.macAddress
            );
            
            return (
              <View key={beacon.id} style={[styles.beaconItemCompact, { backgroundColor: colors.background }]}> 
                <MaterialCommunityIcons 
                  name="bluetooth" 
                  size={16} 
                  color={colors.primary} 
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.beaconNameCompact, { color: colors.text }]} numberOfLines={1}>
                    {beacon.name && beacon.name !== 'Unknown Device' ? beacon.name : 'BLE Beacon'}
                  </Text>
                  <Text style={[styles.beaconIdCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                    {beacon.macAddress}
                  </Text>
                  {beaconPresence && (
                    <Text style={[styles.presenceStatus, { color: colors.textSecondary }]}>
                      {beaconPresence.isPresent ? '🟢 Present' : '🔴 Absent'}
                      {beaconPresence.isPresent && !beaconPresence.attendanceMarked && (
                        beaconPresence.waitTimeElapsed ? ' • Ready' : ` • ${Math.ceil((waitTimeMinutes * 60 - (Date.now() - beaconPresence.firstSeen) / 1000) / 60)}m left`
                      )}
                    </Text>
                  )}
                </View>
                {beaconPresence?.attendanceMarked ? (
                  <Text style={{ color: colors.success, marginLeft: 8, fontSize: 11 }}>✓</Text>
                ) : beaconPresence?.isPresent && beaconPresence?.waitTimeElapsed ? (
                  <Text style={{ color: colors.warning, marginLeft: 8, fontSize: 11 }}>⏳</Text>
                ) : null}
              </View>
            );
          })}
          {hasMoreBeacons && !showAllBeacons && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={() => setShowAllBeacons(true)}>
              <Text style={styles.viewMoreText}>View More</Text>
            </TouchableOpacity>
          )}
          {showAllBeacons && hasMoreBeacons && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={() => setShowAllBeacons(false)}>
              <Text style={styles.viewMoreText}>Show Less</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {currentSession && (
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionText, { color: colors.textSecondary }]}> 
            Active Session: {(currentSession as any).course_name || currentSession.course_id}
          </Text>
        </View>
      )}

      {/* Presence Status */}
      {(() => {
        const presenceStatus = getPresenceStatus();
        if (!presenceStatus) return null;
        
        return (
          <View style={[styles.presenceContainer, { backgroundColor: colors.highlight }]}>
            <MaterialCommunityIcons 
              name={presenceStatus.attendanceMarked ? "check-circle" : "clock-outline"} 
              size={20} 
              color={presenceStatus.attendanceMarked ? colors.success : colors.warning} 
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.presenceTitle, { color: colors.text }]}>
                {presenceStatus.attendanceMarked ? 'Attendance Recorded' : 'Waiting for Attendance'}
              </Text>
              <Text style={[styles.presenceSubtitle, { color: colors.textSecondary }]}>
                {presenceStatus.attendanceMarked 
                  ? `You've been in the room for ${presenceStatus.timeInRoom} minutes`
                  : presenceStatus.waitTimeElapsed 
                    ? 'Ready to record attendance (automatic marking in progress...)'
                    : `${presenceStatus.remainingTime} minutes remaining before attendance is recorded`
                }
              </Text>
            </View>
          </View>
        );
      })()}

      {/* Manual scan button - only show if no automatic attendance is happening */}
      {/* Removed manual scan button for automatic scanning */}

      {/* Check Out button if attendance is marked and no checkout time */}
      {currentAttendanceRecord && !currentAttendanceRecord.check_out_time && (
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.warning }]}
          onPress={() => { console.log('Check Out button pressed'); handleCheckOut(); }}
        >
          <MaterialCommunityIcons 
            name="logout" 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.scanButtonText}>
            Check Out
          </Text>
        </TouchableOpacity>
      )}

      {/* Debug: Show presence data for development */}
      {__DEV__ && presenceData.size > 0 && (
        <View style={[styles.debugContainer, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.debugTitle, { color: colors.text }]}>Debug: Presence Data</Text>
          {Array.from(presenceData.entries()).map(([beaconId, presence]) => (
            <Text key={beaconId} style={[styles.debugText, { color: colors.textSecondary }]}>
              Beacon {beaconId}: Present={presence.isPresent ? 'Yes' : 'No'}, 
              WaitTimeElapsed={presence.waitTimeElapsed ? 'Yes' : 'No'}, 
              AttendanceMarked={presence.attendanceMarked ? 'Yes' : 'No'}
            </Text>
          ))}
        </View>
      )}

      {/* Automatic Attendance Toggle */}
      <View style={styles.automaticToggleContainer}>
        <Text style={[styles.automaticToggleLabel, { color: colors.text }]}>
          Automatic Attendance
        </Text>
        <TouchableOpacity
          style={[
            styles.automaticToggle,
            { 
              backgroundColor: automaticAttendanceEnabled ? colors.success : colors.inactive,
              opacity: automaticAttendanceEnabled ? 1 : 0.6
            }
          ]}
          onPress={() => setAutomaticAttendanceEnabled(!automaticAttendanceEnabled)}
        >
          <MaterialCommunityIcons 
            name={automaticAttendanceEnabled ? "check" : "close"} 
            size={16} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {attendanceMarked && (
        <View style={[styles.successMessage, { backgroundColor: colors.success }]}>
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          <Text style={styles.successText}>
            Attendance recorded automatically!
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  beaconsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1D1F',
  },
  beaconItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    minHeight: 36,
  },
  beaconNameCompact: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1D1F',
    marginBottom: 0,
  },
  beaconIdCompact: {
    fontSize: 10,
    color: '#6C7072',
    fontFamily: 'monospace',
  },
  connectButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginLeft: 4,
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginTop: 8, // Increase margin for better spacing
    marginBottom: 8, // Add margin to bottom
    paddingVertical: 6, // Slightly larger tap area
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2, // For Android
  },
  viewMoreText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  presenceStatus: {
    fontSize: 10,
    marginTop: 2,
  },
  presenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  presenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  presenceSubtitle: {
    fontSize: 12,
  },
  automaticToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  automaticToggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  automaticToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  debugContainer: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});