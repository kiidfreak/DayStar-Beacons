import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
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
  // Debug log
  console.log('Sidebar user:', user);
  const [expanded, setExpanded] = useState(false); // Start collapsed by default
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;
  
  if (!hydrated) {
    // Show a loading spinner while waiting for hydration
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Use your custom Loading component if available, else fallback to ActivityIndicator */}
        {/* <Loading /> */}
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // Determine if sidebar should be shown as overlay on mobile
  const showAsOverlay = isMobile && expanded;
  
  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };
  
  // Check if a route is active
  const isRouteActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  };
  
  // Navigation items
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
  
  // Role-based navigation items
  const adminNavItems = [
    {
      icon: <Feather name="check-circle" size={24} color={isRouteActive('/admin/approvals') ? colors.primary : colors.textSecondary} />,
      label: 'QR Approvals',
      route: '/admin/approvals',
    },
    {
      icon: <Feather name="clock" size={24} color={isRouteActive('/admin/history') ? colors.primary : colors.textSecondary} />,
      label: 'Attendance History',
      route: '/admin/history',
    },
    {
      icon: <Feather name="bar-chart-2" size={24} color={isRouteActive('/admin/reports') ? colors.primary : colors.textSecondary} />,
      label: 'Reports',
      route: '/admin/reports',
    },
    {
      icon: <Feather name="settings" size={24} color={isRouteActive('/settings') ? colors.primary : colors.textSecondary} />,
      label: 'Settings',
      route: '/settings',
    },
  ];
  
  // Use adminNavItems if admin, else student navItems
  const navItemsToShow = user?.role === 'admin' ? adminNavItems : navItems;
  
  // Handle navigation
  const navigateTo = (route: string) => {
    router.push(route as any);
    if (isMobile) {
      setExpanded(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    // Use setTimeout to ensure state is updated before navigation
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
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                {user?.studentId || 'S12345'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Navigation items */}
        <View style={styles.navItems}>
          {navItemsToShow.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.navItem,
                isRouteActive(item.route) && [
                  styles.activeNavItem,
                  { backgroundColor: `${colors.primary}15` }
                ]
              ]}
              onPress={() => navigateTo(item.route)}
            >
              <View style={styles.navIcon}>
                {item.icon}
              </View>
              {expanded && (
                <Text 
                  style={[
                    styles.navLabel,
                    { 
                      color: isRouteActive(item.route) 
                        ? colors.primary 
                        : colors.text 
                    }
                  ]}
                >
                  {item.label}
                </Text>
              )}
              {isRouteActive(item.route) && expanded && (
                <View 
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: colors.primary }
                  ]} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Logout button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { borderTopColor: colors.border }
          ]}
          onPress={handleLogout}
        >
          <View style={styles.navIcon}>
            <Feather name="log-out" size={24} color={colors.error} />
          </View>
          
          {expanded && (
            <Text style={[styles.logoutText, { color: colors.error }]}>
              Logout
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Main content */}
      <View style={[
        styles.content,
        { 
          backgroundColor: colors.background,
          marginLeft: showAsOverlay ? 0 : (expanded ? SIDEBAR_WIDTH : 0)
        }
      ]}>
        {/* Overlay for mobile when sidebar is expanded */}
        {showAsOverlay && (
          <TouchableOpacity
            style={[
              styles.overlay,
              { backgroundColor: 'rgba(0,0,0,0.5)' }
            ]}
            onPress={() => setExpanded(false)}
            activeOpacity={1}
          />
        )}
        {/* Mobile header with menu button - only show when sidebar is not visible */}
        {isMobile && !expanded && !showAsOverlay && (
          <View style={[
            styles.mobileHeader,
            { 
              backgroundColor: colors.background,
              borderBottomColor: colors.border
            }
          ]}>
            {/* <TouchableOpacity onPress={toggleSidebar}>
              <Feather name="menu" size={24} color={colors.primary} />
            </TouchableOpacity> */}
            <Text style={[styles.mobileTitle, { color: colors.text }]}>UniConnect</Text>
            <Avatar 
              name={user?.name || 'Student'} 
              size="small"
            />
          </View>
        )}
        
        <Stack screenOptions={{
          headerShown: false,
        }} />
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
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
  },
  navItems: {
    flex: 1,
    paddingTop: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    position: 'relative',
  },
  activeNavItem: {
    borderRadius: 8,
    marginHorizontal: 8,
  },
  navIcon: {
    width: 36,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    width: 4,
    height: '50%',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});