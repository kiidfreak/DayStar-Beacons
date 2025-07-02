import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  elevated?: boolean;
}

export default function Card({ 
  children, 
  style, 
  gradient = false,
  elevated = false
}: CardProps) {
  const { colors } = useTheme();
  
  // Safely combine styles for web compatibility
  const cardStyles = StyleSheet.flatten([
    styles.card, 
    { 
      backgroundColor: gradient ? undefined : colors.card,
      borderColor: colors.border,
      shadowColor: colors.text,
    },
    elevated && styles.elevated,
    style
  ]);
  
  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.cardGradientStart, colors.cardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles}
      >
        {children}
      </LinearGradient>
    );
  }
  
  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    // Improved mobile touch feedback
    minHeight: Platform.OS === 'ios' ? 44 : 48,
  },
  elevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    // Better shadow for iOS
    ...(Platform.OS === 'ios' && {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
  },
});