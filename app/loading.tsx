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
  const { isAuthenticated, user } = useAuthStore();
  const { university } = useUniversityStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const [hasNavigated, setHasNavigated] = React.useState(false);
  
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
    
    // Navigate based on auth state - only once
    if (!hasNavigated) {
      console.log('Loading screen - isAuthenticated:', isAuthenticated, 'user:', user?.id, 'university:', university);
      console.log('Starting navigation timer...');
      
      // Simplified navigation - always go to university selection first
      const timer = setTimeout(() => {
        console.log('Navigation timer fired - going to university selection');
        try {
          console.log('Navigating to university selection');
          router.push('/(auth)/select-university');
          setHasNavigated(true);
          console.log('Navigation completed successfully');
        } catch (error) {
          console.error('Navigation error:', error);
          console.log('Navigation failed, app may be stuck');
        }
      }, 1000);
      
      // Fallback timer to ensure navigation happens
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback timer fired - forcing navigation');
        if (!hasNavigated) {
          console.log('Fallback navigation to university selection');
          try {
            router.push('/(auth)/select-university');
            setHasNavigated(true);
          } catch (error) {
            console.error('Fallback navigation also failed:', error);
          }
        }
      }, 2000);
      
      return () => {
        console.log('Cleaning up timers');
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    }
  }, [isAuthenticated, user, university, router, fadeAnim, scaleAnim, hasNavigated]);
  
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