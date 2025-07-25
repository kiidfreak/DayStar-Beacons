import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export default function Logo({ size = 'medium', showTagline = true }: LogoProps) {
  const { themeColors } = useThemeStore();
  
  // Fallback colors to prevent undefined errors
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
  
  // Get logo size
  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 40 };
      case 'medium':
        return { width: 160, height: 50 };
      case 'large':
        return { width: 200, height: 60 };
      default:
        return { width: 160, height: 50 };
    }
  };
  
  const logoSize = getLogoSize();
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.logoContainer, logoSize]}
      >
        <Text style={styles.logoText}>T</Text>
        <Text style={styles.logoTextSmall}>CHECK</Text>
      </LinearGradient>
      
      {showTagline && (
        <Text style={[styles.tagline, { color: colors.primary }]}>
          Attendance Made Simple
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoTextSmall: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});