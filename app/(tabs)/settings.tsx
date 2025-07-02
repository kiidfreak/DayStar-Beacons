import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { colors, activeTheme, isDark } = useTheme();
  const { setTheme, isSystemTheme, setIsSystemTheme } = useThemeStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
    setIsSystemTheme(false);
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
      <TouchableOpacity 
        style={styles.profileHeader}
        onPress={() => router.push('/profile')}
      >
        <Avatar 
          name={user?.name || 'Student Name'} 
          size="large"
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.name || 'Student Name'}
          </Text>
          <Text style={[styles.profileId, { color: colors.textSecondary }]}>
            {user?.studentId || 'S12345'}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>
        
        <Card style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="smartphone" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Device Binding
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Your account is bound to this device
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        
        <Card style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <MaterialCommunityIcons name="palette" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Theme
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {isSystemTheme ? 'System default' : isDark ? 'Dark mode' : 'Light mode'}
            </Text>
          </View>
          <View style={styles.themeButtons}>
            <TouchableOpacity 
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: !isSystemTheme && !isDark ? colors.primary : 'transparent',
                  borderColor: colors.border,
                }
              ]}
              onPress={() => {
                setTheme('light');
                setIsSystemTheme(false);
              }}
            >
              <Feather name="sun" size={16} color={!isSystemTheme && !isDark ? 'white' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.themeButton, 
                { 
                  backgroundColor: !isSystemTheme && isDark ? colors.primary : 'transparent',
                  borderColor: colors.border,
                }
              ]}
              onPress={() => {
                setTheme('dark');
                setIsSystemTheme(false);
              }}
            >
              <Feather name="moon" size={16} color={!isSystemTheme && isDark ? 'white' : colors.text} />
            </TouchableOpacity>
          </View>
        </Card>
        
        <Card style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Use System Theme
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Follow system dark/light mode
            </Text>
          </View>
          <Switch
            value={isSystemTheme}
            onValueChange={toggleSystemTheme}
            trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
            thumbColor={isSystemTheme ? colors.primary : '#f4f3f4'}
          />
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferences
        </Text>
        
        <Card style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="bell" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Receive alerts for attendance
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.inactive, true: `${colors.primary}80` }}
            thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
          />
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Security
        </Text>
        
        <Card style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="shield" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Privacy Policy
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              How we handle your data
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Support
        </Text>
        
        <Card style={styles.settingItem}>
          <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="help-circle" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Help Center
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Get help with the app
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Card>
      </View>
      
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        size="medium"
        icon={<Feather name="log-out" size={20} color={colors.error} style={{ marginRight: 8 }} />}
        style={{ ...styles.logoutButton, borderColor: colors.error }}
        textStyle={{ color: colors.error }}
      />
      
      <Text style={[styles.versionText, { color: colors.textSecondary }]}>
        UniConnect v1.0.0
      </Text>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  settingIconContainer: {
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
  },
});