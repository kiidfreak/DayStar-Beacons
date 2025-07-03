import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname, Slot } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import { LinearGradient } from 'expo-linear-gradient';

const SIDEBAR_WIDTH = 250;
const COLLAPSED_WIDTH = 70;

export default function SidebarLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, hydrated } = useAuthStore();
  const [expanded, setExpanded] = useState(false); // Start collapsed by default
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;

  useEffect(() => {
    setExpanded(false); // Always collapse sidebar on route change
  }, [pathname]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showAsOverlay = isMobile && expanded;

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const isRouteActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  };

  const navItems = [
    { 
      icon: <Feather name="home" size={24} color={isRouteActive('/') ? colors.primary : colors.textSecondary} />, 
      label: 'Home', 
      route: '/' 
    },
    { 
      icon: <Feather name="book" size={24} color={isRouteActive('/courses') ? colors.primary : colors.textSecondary} />, 
      label: 'Courses', 
      route: '/courses' 
    },
    { 
      icon: <Feather name="clock" size={24} color={isRouteActive('/history') ? colors.primary : colors.textSecondary} />, 
      label: 'History', 
      route: '/history' 
    },
    { 
      icon: <Feather name="calendar" size={24} color={isRouteActive('/calendar') ? colors.primary : colors.textSecondary} />, 
      label: 'Calendar', 
      route: '/calendar' 
    },
    { 
      icon: <Feather name="user" size={24} color={isRouteActive('/profile') ? colors.primary : colors.textSecondary} />, 
      label: 'Profile', 
      route: '/profile' 
    },
    { 
      icon: <Feather name="settings" size={24} color={isRouteActive('/settings') ? colors.primary : colors.textSecondary} />, 
      label: 'Settings', 
      route: '/settings' 
    },
  ];

  const navItemsToShow = navItems;

  const navigateTo = (route: string) => {
    router.push(route as any);
    setExpanded(false); // Always collapse after navigation
  };

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View 
        style={[
          styles.sidebar, 
          { 
            backgroundColor: colors.card,
            borderRightColor: colors.border,
            width: expanded ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
            position: showAsOverlay ? 'absolute' : 'relative',
            zIndex: showAsOverlay ? 100 : 1,
            height: showAsOverlay ? '100%' : '100%',
          }
        ]}
      >
        {/* Header with logo/branding */}
        <View
          style={[
            styles.sidebarHeader,
            expanded
              ? {}
              : { justifyContent: 'center', paddingLeft: 0, paddingRight: 0 },
          ]}
        >
          {expanded ? (
            <>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoContainer}
              >
                <Text style={styles.logoText}>UC</Text>
              </LinearGradient>
              <Text style={[styles.appName, { color: colors.text }]}>UniConnect</Text>
              <TouchableOpacity
                onPress={toggleSidebar}
                style={[
                  styles.toggleButton,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Feather name="chevron-left" size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={toggleSidebar}
              style={[
                styles.toggleButton,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Feather name="menu" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {/* User profile section */}
        <View style={[
          styles.userSection,
          { borderBottomColor: colors.border }
        ]}>
          <Avatar 
            name={user?.name || 'Student'} 
            size={expanded ? "medium" : "small"}
          />
          {expanded && (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.name || 'Student'}
              </Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>Student</Text>
            </View>
          )}
        </View>
        {/* Navigation items */}
        <View style={styles.navSection}>
          {navItemsToShow.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.navItem,
                isRouteActive(item.route) && { backgroundColor: `${colors.primary}15` },
              ]}
              onPress={() => navigateTo(item.route)}
            >
              {item.icon}
              {expanded && (
                <Text style={[styles.navLabel, { color: isRouteActive(item.route) ? colors.primary : colors.textSecondary }]}> 
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {/* Logout button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderTopColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* Main content */}
      <View style={styles.content}>
        {/* Render children via Slot or Stack */}
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.select({ ios: 40, android: 24 }),
    paddingBottom: 24,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  sidebarHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  toggleButton: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 20,
  },
  userSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 12,
    color: '#888',
  },
  navSection: {
    width: '100%',
    flex: 1,
    marginTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});