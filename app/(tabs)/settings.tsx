import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  // Notification toggles
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [classAlerts, setClassAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  console.log('SettingsScreen: Rendering with user:', user?.id);

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

  const handleChangeDevice = () => {
    // Show alert for device change
    Alert.alert(
      'Change Device',
      'This will unregister your current device. You will need to register a new device for attendance tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive' }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                  onValueChange={setAttendanceReminders}
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
                  onValueChange={setClassAlerts}
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
                  onValueChange={setSystemUpdates}
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
                  onValueChange={setEmailDigest}
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
            
            <TouchableOpacity 
              style={[styles.changeDeviceButton, { borderColor: colors.border }]}
              onPress={handleChangeDevice}
            >
              <Text style={[styles.changeDeviceText, { color: colors.text }]}>
                Change Device Registration
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
});