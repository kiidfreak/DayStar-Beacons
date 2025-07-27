import React, { useState } from 'react';
import { Platform, Dimensions, View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const fallbackThemeColors = {
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

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { themeColors } = useThemeStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-300));

  // Bulletproof fallback
  const safeThemeColors = (themeColors && typeof themeColors === 'object') ? themeColors : fallbackThemeColors;

  console.log('TabsLayout - user:', user?.id, 'isDark:', isDark);

  // Animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle sidebar animation
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  // Simple check: if no user, just show loading
  if (!user || !user.id) {
    console.log('TabsLayout - no user, showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: safeThemeColors.background }}>
        <Text style={{ color: safeThemeColors.text, fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  console.log('TabsLayout - rendering tabs with user:', user.id);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { key: 'index', label: 'Home', icon: 'home', route: '/(tabs)' },
    { key: 'timetable', label: 'My Timetable', icon: 'calendar', route: '/(tabs)/courses' },
    { key: 'history', label: 'Attendance History', icon: 'time', route: '/(tabs)/history' },
    { key: 'profile', label: 'Profile', icon: 'person', route: '/(tabs)/settings' },
    { key: 'courses', label: 'Courses', icon: 'book', route: '/(tabs)/courses' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications', route: '/(tabs)/settings' },
    { key: 'settings', label: 'Settings', icon: 'settings', route: '/(tabs)/settings' },
    { key: 'faq', label: 'FAQs', icon: 'help-circle', route: '/faq' },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar,
          { 
            backgroundColor: safeThemeColors.card,
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        {/* Sidebar Header */}
        <View style={styles.sidebarHeader}>
          <Text style={[styles.sidebarTitle, { color: safeThemeColors.primary }]}>
            Tcheck
          </Text>
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationItems}>
          {navigationItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                item.key === 'index' && { backgroundColor: safeThemeColors.primary }
              ]}
              onPress={() => {
                router.push(item.route as any);
                setSidebarOpen(false);
              }}
            >
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={item.key === 'index' ? '#FFFFFF' : safeThemeColors.text} 
              />
              <Text style={[
                styles.navText, 
                { color: item.key === 'index' ? '#FFFFFF' : safeThemeColors.text }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={safeThemeColors.error} />
          <Text style={[styles.signOutText, { color: safeThemeColors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <View style={[styles.mainContent, { backgroundColor: safeThemeColors.background, flex: 1 }]}>
        {/* Top Header */}
        <View style={[styles.topHeader, { backgroundColor: safeThemeColors.card }]}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            <Feather name="menu" size={24} color={safeThemeColors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={[styles.logoCircle, { backgroundColor: safeThemeColors.primary }]}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTitle, { color: safeThemeColors.primary }]}>Tcheck</Text>
              <Text style={[styles.logoSubtitle, { color: safeThemeColors.textSecondary }]}>Student Attendance</Text>
            </View>
          </View>
        </View>

        {/* Tab Content */}
        <Tabs 
          screenOptions={{ 
            headerShown: false,
            tabBarStyle: { display: 'none' }
          }}
        >
          <Tabs.Screen 
            name="index" 
            options={{ 
              title: 'Dashboard',
            }} 
          />
          <Tabs.Screen 
            name="courses" 
            options={{ 
              title: 'Courses',
            }} 
          />
          <Tabs.Screen 
            name="history" 
            options={{ 
              title: 'History',
            }} 
          />
          <Tabs.Screen 
            name="settings" 
            options={{ 
              title: 'Settings',
            }} 
          />
        </Tabs>
      </View>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setSidebarOpen(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 280,
    height: '100%',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  sidebarHeader: {
    marginBottom: 40,
  },
  sidebarTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  navigationItems: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
    marginTop: 'auto',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    width: '100%',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
});