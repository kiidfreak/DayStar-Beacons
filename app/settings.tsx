import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useUniversityStore } from '@/store/universityStore';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import QRGenerator from '@/components/QRGenerator';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { theme, isSystemTheme, setTheme, setIsSystemTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { clearUniversity } = useUniversityStore();
  
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              clearUniversity();
              router.replace('/(auth)/select-university');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const toggleTheme = () => {
    if (isSystemTheme) {
      setIsSystemTheme(false);
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  const toggleSystemTheme = () => {
    setIsSystemTheme(!isSystemTheme);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileSection}>
        <Avatar 
          name={user?.name || 'Student'} 
          size="large"
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.name || 'Student Name'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {user?.email || 'student@uni.edu'}
          </Text>
        </View>
      </View>
      
      {/* Demo QR Generator for testing */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Demo Features
        </Text>
        <QRGenerator />
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        
        <Card elevated style={styles.card}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={toggleTheme}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              {isDark ? <Feather name="moon" size={20} color={colors.primary} /> : <Feather name="sun" size={20} color={colors.primary} />}
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Switch to {isDark ? 'light' : 'dark'} theme
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="settings" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Use System Theme
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Follow your device theme settings
              </Text>
            </View>
            <Switch
              value={isSystemTheme}
              onValueChange={toggleSystemTheme}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
              thumbColor={isSystemTheme ? colors.primary : colors.inactive}
            />
          </TouchableOpacity>
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Security & Privacy
        </Text>
        
        <Card elevated style={styles.card}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Security Info', 'QR codes use time-based validation, location verification, and cryptographic signatures to prevent tampering and unauthorized access.')}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialCommunityIcons name="qrcode" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                QR Code Security
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enhanced security with encryption & validation
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Location Info', 'Location data is used to verify you are in the correct classroom. Your location is only checked during attendance and not stored permanently.')}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="map-pin" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Location Verification
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Ensures you are in the correct classroom
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="shield" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Privacy Settings
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Manage your data and privacy preferences
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>
        
        <Card elevated style={styles.card}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/profile')}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="smartphone" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Profile Settings
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Update your personal information
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/change-password')}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="lock" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Change Password
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Update your account password
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="bell" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notification Settings
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Customize your notification preferences
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Support
        </Text>
        
        <Card elevated style={styles.card}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/faq')}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="help-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                FAQ
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Frequently Asked Questions
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="message-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Contact Support
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Get help from our support team
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>
      
      <View style={styles.logoutContainer}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          size="large"
          icon={<Feather name="log-out" size={20} color={colors.error} />}
          style={{ ...styles.logoutButton, borderColor: colors.error }}
          textStyle={{ color: colors.error }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  logoutContainer: {
    marginTop: 32,
  },
  logoutButton: {
    borderWidth: 1,
  },
});