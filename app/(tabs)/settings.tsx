import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.welcomeName, { color: themeColors.text }]}>
              {user?.firstName || 'Student'}!
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)')}
          >
            <MaterialCommunityIcons name="home" size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account" size={24} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Profile
            </Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: themeColors.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.profileId, { color: themeColors.textSecondary }]}>
              Student ID: {user?.id}
            </Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={24} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Settings
            </Text>
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="cellphone" size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Device Settings
              </Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                Manage device binding and security
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                Manage notification preferences
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Privacy & Security
              </Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                Manage privacy settings
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color={themeColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>
                Help & Support
              </Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
                Get help and contact support
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="home" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)/courses')}
          >
            <Ionicons name="book" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>Courses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time" size={24} color={themeColors.primary} />
            <Text style={[styles.actionText, { color: themeColors.text }]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: themeColors.error }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={themeColors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: themeColors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: themeColors.textSecondary }]}>
          Version 1.0.0
        </Text>
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
    padding: 20,
    paddingBottom: 32,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  profileInfo: {
    marginTop: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,174,239,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
  },
});