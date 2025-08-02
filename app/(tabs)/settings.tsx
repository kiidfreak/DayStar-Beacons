import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Switch, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NotificationSettings {
  attendanceReminders: boolean;
  classAlerts: boolean;
  systemUpdates: boolean;
  emailDigest: boolean;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  // Notification toggles with default values
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [classAlerts, setClassAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    isRegistered: false,
    deviceId: null,
    registeredAt: null
  });

  console.log('SettingsScreen: Rendering with user:', user?.id);

  // Load saved notification settings
  useEffect(() => {
    loadNotificationSettings();
    loadDeviceStatus();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsedSettings: NotificationSettings = JSON.parse(settings);
        setAttendanceReminders(parsedSettings.attendanceReminders);
        setClassAlerts(parsedSettings.classAlerts);
        setSystemUpdates(parsedSettings.systemUpdates);
        setEmailDigest(parsedSettings.emailDigest);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceStatus = async () => {
    const status = await getDeviceRegistrationStatus();
    setDeviceStatus(status);
  };

  const checkNotificationSettings = () => {
    // This function can be called from other parts of the app to check if notifications should be sent
    return {
      attendanceReminders,
      classAlerts,
      systemUpdates,
      emailDigest
    };
  };

  const refreshDeviceStatus = async () => {
    await loadDeviceStatus();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadNotificationSettings(),
        loadDeviceStatus()
      ]);
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('Notification settings saved:', settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleAttendanceRemindersToggle = async (value: boolean) => {
    setAttendanceReminders(value);
    const settings: NotificationSettings = {
      attendanceReminders: value,
      classAlerts,
      systemUpdates,
      emailDigest,
    };
    await saveNotificationSettings(settings);
    
    if (value) {
      // Request notification permissions if enabling
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive attendance reminders.'
        );
      }
    }
  };

  const handleClassAlertsToggle = async (value: boolean) => {
    setClassAlerts(value);
    const settings: NotificationSettings = {
      attendanceReminders,
      classAlerts: value,
      systemUpdates,
      emailDigest,
    };
    await saveNotificationSettings(settings);
  };

  const handleSystemUpdatesToggle = async (value: boolean) => {
    setSystemUpdates(value);
    const settings: NotificationSettings = {
      attendanceReminders,
      classAlerts,
      systemUpdates: value,
      emailDigest,
    };
    await saveNotificationSettings(settings);
  };

  const handleEmailDigestToggle = async (value: boolean) => {
    setEmailDigest(value);
    const settings: NotificationSettings = {
      attendanceReminders,
      classAlerts,
      systemUpdates,
      emailDigest: value,
    };
    await saveNotificationSettings(settings);
    
    if (value) {
      // Update user preferences in database
      try {
        await supabase
          .from('users')
          .update({ email_digest_enabled: true })
          .eq('id', user?.id);
      } catch (error) {
        console.error('Error updating email digest preference:', error);
      }
    }
  };

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#3B82F6',
    secondary: '#2563EB',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    inactive: '#9CA3AF',
    highlight: '#EFF6FF',
  };

  // Animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangeDevice = async () => {
    Alert.alert(
      'Change Device Registration',
      'This will unregister your current device. You will need to register a new device for attendance tracking. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear device registration from database
              await supabase
                .from('users')
                .update({ 
                  device_id: null,
                  device_registered_at: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

              // Clear local device data
              await AsyncStorage.removeItem('deviceRegistration');
              
              Alert.alert(
                'Device Unregistered',
                'Your device has been unregistered. You will need to register a new device to continue using attendance tracking.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to device registration screen or logout
                      router.replace('/(auth)/login');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error unregistering device:', error);
              Alert.alert('Error', 'Failed to unregister device. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getDeviceRegistrationStatus = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('device_id, device_registered_at')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching device status:', error);
        return { isRegistered: false, deviceId: null, registeredAt: null };
      }

      return {
        isRegistered: !!userData?.device_id,
        deviceId: userData?.device_id,
        registeredAt: userData?.device_registered_at
      };
    } catch (error) {
      console.error('Error getting device status:', error);
      return { isRegistered: false, deviceId: null, registeredAt: null };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        

        {/* Main Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your preferences and get help
          </Text>
        </Animated.View>

        {/* Notification Preferences */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.preferencesCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Notification Preferences
              </Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Choose which notifications you want to receive
            </Text>
            
            <View style={styles.preferencesList}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                    Attendance Reminders
                  </Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    Get notified about upcoming classes.
                  </Text>
                </View>
                <Switch
                  value={attendanceReminders}
                  onValueChange={handleAttendanceRemindersToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                    Class Alerts
                  </Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    Immediate alerts for missed classes.
                  </Text>
                </View>
                <Switch
                  value={classAlerts}
                  onValueChange={handleClassAlertsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                    System Updates
                  </Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    App updates and maintenance notices.
                  </Text>
                </View>
                <Switch
                  value={systemUpdates}
                  onValueChange={handleSystemUpdatesToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                    Email Digest
                  </Text>
                  <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                    Weekly attendance summary via email.
                  </Text>
                </View>
                <Switch
                  value={emailDigest}
                  onValueChange={handleEmailDigestToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Device Management */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.deviceCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Device Management
              </Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Manage your registered device for attendance tracking
            </Text>
            
            {/* Device Status */}
            <View style={styles.deviceStatus}>
              <View style={styles.deviceInfo}>
                <View style={styles.statusRow}>
                  <Ionicons 
                    name={deviceStatus.isRegistered ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={deviceStatus.isRegistered ? colors.success : colors.error} 
                  />
                  <Text style={[styles.deviceStatusText, { color: colors.text }]}>
                    {deviceStatus.isRegistered ? 'Device Registered' : 'Device Not Registered'}
                  </Text>
                  {deviceStatus.isRegistered && (
                    <View style={[styles.activeTag, { backgroundColor: colors.primary }]}>
                      <Text style={styles.activeTagText}>Active</Text>
                    </View>
                  )}
                </View>
               
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.changeDeviceButton, { borderColor: colors.border }]}
              onPress={handleChangeDevice}
            >
              <Text style={[styles.changeDeviceText, { color: colors.text }]}>
                {deviceStatus.isRegistered ? 'Change Device Registration' : 'Register Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Account Actions */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.accountCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.accountAction}
              onPress={() => router.push('/change-password')}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
              <Text style={[styles.accountActionText, { color: colors.text }]}>
                Change Password
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.accountAction}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.accountActionText, { color: colors.error }]}>
                Sign Out
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
  },
  titleContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  preferencesCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  preferencesList: {
    gap: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  changeDeviceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeDeviceText: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  accountActionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  deviceStatus: {
    marginTop: 16,
    marginBottom: 20,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deviceDetails: {
    fontSize: 14,
    marginTop: 4,
  },
});