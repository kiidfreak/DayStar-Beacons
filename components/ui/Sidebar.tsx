import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { logout } = useAuthStore();
  
  const handleLogout = async () => {
    await logout();
    onClose();
  };
  
  const menuItems = [
    { icon: 'home-outline', label: 'Home', route: '/' },
    { icon: 'book-outline', label: 'Courses', route: '/courses' },
    { icon: 'calendar-outline', label: 'Calendar', route: '/calendar' },
    { icon: 'time-outline', label: 'History', route: '/history' },
    { icon: 'help-circle-outline', label: 'FAQ', route: '/faq' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  ];
  
  const handleNavigation = (route: string) => {
    router.push(route as any);
    onClose();
  };
  
  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      
      <SafeAreaView
        style={[
          styles.sidebar,
          { 
            backgroundColor: colors.background,
            borderRightColor: colors.border,
            transform: [{ translateX: isOpen ? 0 : -300 }]
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoContainer}>
          <Logo size="medium" showTagline={false} />
        </View>
        
        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: colors.card }
              ]}
              onPress={() => handleNavigation(item.route)}
            >
              <Ionicons name={item.icon as any} size={24} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.logoutButton, { borderTopColor: colors.border }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    zIndex: 20,
    // Ensure sidebar content is not covered
    paddingTop: Platform.select({
      ios: 0, // SafeAreaView handles this
      android: 0,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    // Add extra top padding for better mobile experience
    paddingTop: Platform.select({
      ios: 16,
      android: 24,
    }),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    // Better touch target for mobile
    minHeight: Platform.select({
      ios: 44,
      android: 48,
    }),
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    // Better touch target for mobile
    minHeight: Platform.select({
      ios: 44,
      android: 48,
    }),
    // Add bottom padding for safe area
    paddingBottom: Platform.select({
      ios: 34, // Account for home indicator
      android: 16,
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});