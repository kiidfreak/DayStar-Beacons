import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Button from '@/components/ui/Button';

export default function RandomCheckPrompt() {
  const { checkInPrompt, respondToCheckInPrompt } = useAttendanceStore();
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(60);
  const [confirmed, setConfirmed] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  
  useEffect(() => {
    if (checkInPrompt) {
      // Trigger haptic feedback on prompt appearance
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      // Calculate time left in seconds
      const secondsLeft = Math.max(0, Math.floor((checkInPrompt.expiresAt - Date.now()) / 1000));
      setTimeLeft(secondsLeft);
      setConfirmed(false);
      
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      
      // Countdown timer
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Auto-dismiss after timeout
            setTimeout(() => respondToCheckInPrompt(false), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(interval);
        slideAnim.setValue(-300);
      };
    }
  }, [checkInPrompt, respondToCheckInPrompt, slideAnim]);
  
  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setConfirmed(true);
    
    // Add a small delay before dismissing for animation
    setTimeout(() => {
      respondToCheckInPrompt(true);
    }, 1000);
  };
  
  if (!checkInPrompt) return null;
  
  // Safely create styles for web compatibility
  const containerStyle = StyleSheet.flatten([
    styles.container,
    { 
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: colors.text,
      transform: [{ translateY: slideAnim }] 
    }
  ]);
  
  const timerContainerStyle = StyleSheet.flatten([
    styles.timerContainer, 
    { backgroundColor: `${colors.warning}15` }
  ]);
  
  return (
    <Animated.View style={containerStyle}>
      {confirmed ? (
        <View style={styles.confirmedContainer}>
          <Feather name="check-circle" size={48} color={colors.success} />
          <Text style={[styles.confirmedText, { color: colors.success }]}>
            Presence Confirmed!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Feather name="alert-circle" size={24} color="currentColor" />
            <Text style={[styles.title, { color: colors.text }]}>
              Attendance Verification
            </Text>
          </View>
          
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Please confirm your presence in {checkInPrompt.courseName}
          </Text>
          
          <View style={timerContainerStyle}>
            <Text style={[styles.timerText, { color: colors.warning }]}>
              Expires in: {timeLeft}s
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Confirm Presence"
              onPress={handleConfirm}
              variant="primary"
              size="medium"
            />
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  timerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  timerText: {
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'flex-end',
  },
  confirmedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  confirmedText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  }
});