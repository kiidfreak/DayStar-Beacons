import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Platform
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
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
  
  // Determine button styles based on variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };
  
  // Determine text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };
  
  // Determine button size - improved for mobile
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          minHeight: Platform.OS === 'ios' ? 36 : 40,
        };
      case 'medium':
        return {
          paddingVertical: 14,
          paddingHorizontal: 28,
          borderRadius: 14,
          minHeight: Platform.OS === 'ios' ? 44 : 48,
        };
      case 'large':
        return {
          paddingVertical: 18,
          paddingHorizontal: 36,
          borderRadius: 18,
          minHeight: Platform.OS === 'ios' ? 52 : 56,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 28,
          borderRadius: 14,
          minHeight: Platform.OS === 'ios' ? 44 : 48,
        };
    }
  };
  
  // Get font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  
  const buttonStyle = getButtonStyle();
  const textColor = getTextColor();
  const buttonSize = getButtonSize();
  const fontSize = getFontSize();
  
  // Combine styles safely for web compatibility
  const combinedStyles = StyleSheet.flatten([
    styles.button,
    buttonStyle,
    buttonSize,
    disabled && styles.disabled,
    style,
  ]);
  
  return (
    <TouchableOpacity
      style={combinedStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      // Better touch feedback for mobile
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={StyleSheet.flatten([
            styles.text,
            { color: textColor, fontSize },
            textStyle,
          ])}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // Better mobile touch feedback
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    // Better text rendering on mobile
    ...Platform.select({
      ios: {
        letterSpacing: -0.2,
      },
    }),
  },
  textWithIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});