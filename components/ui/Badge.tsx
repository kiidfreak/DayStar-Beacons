import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  text,
  variant = 'primary',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();
  
  // Get badge color based on variant
  const getBadgeColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.secondary;
      default:
        return colors.primary;
    }
  };
  
  const badgeColor = getBadgeColor();
  
  // Safely combine styles for web compatibility
  const badgeStyles = StyleSheet.flatten([
    styles.badge,
    { backgroundColor: `${badgeColor}20` },
    style,
  ]);
  
  const textStyles = StyleSheet.flatten([
    styles.text,
    { color: badgeColor },
    textStyle,
  ]);
  
  return (
    <View style={badgeStyles}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={textStyles}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});