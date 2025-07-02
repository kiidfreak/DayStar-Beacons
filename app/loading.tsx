import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useUniversityStore } from '@/store/universityStore';
import Logo from '@/components/ui/Logo';

export default function LoadingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { university } = useUniversityStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate after shorter delay with timeout protection
    const timer = setTimeout(() => {
      try {
        if (isAuthenticated) {
          router.replace('/');
        } else if (university) {
          router.replace('/(auth)/login');
        } else {
          router.replace('/(auth)/select-university');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.replace('/(auth)/select-university');
      }
    }, 800); // Reduced from 1000ms to 800ms
    
    // Fallback timer to prevent infinite loading
    // const fallbackTimer = setTimeout(() => {
    //   console.warn('Loading screen timeout, forcing navigation');
    //   try {
    //     router.replace('/(auth)/select-university');
    //   } catch (error) {
    //     console.error('Fallback navigation error:', error);
    //   }
    // }, 3000);
    
    return () => {
      clearTimeout(timer);
      // clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, university, router, fadeAnim, scaleAnim]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Logo size="large" showTagline={true} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
});