import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Image } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export default function Loading({ message = 'Loading...', size = 'large' }: LoadingProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const spinAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const { themeColors } = useThemeStore();

  // Fallback colors to prevent undefined errors
  const fallbackColors = themeColors || {
    background: '#FFFFFF',
    card: '#F7F9FC',
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

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, fadeAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: fallbackColors.background }]}>  
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { scale: pulseAnim },
              { rotate: spin },
            ],
            shadowColor: fallbackColors.primary,
            shadowOpacity: 0.18,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          },
        ]}
      >
        <Image
          source={require('@/assets/images/logo-gradient.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={[styles.tagline, { color: fallbackColors.primary }]}>{message}</Text>
      <View style={styles.loadingIndicator}>
        <Animated.View style={[styles.dot, { backgroundColor: fallbackColors.primary, opacity: fadeAnim }]} />
        <Animated.View style={[styles.dot, { backgroundColor: fallbackColors.primary, opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: fallbackColors.primary, opacity: fadeAnim }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 28,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  loadingIndicator: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.7,
  },
});