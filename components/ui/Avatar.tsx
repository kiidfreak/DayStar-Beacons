import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';

type AvatarSize = 'small' | 'medium' | 'large';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export default function Avatar({
  name,
  imageUrl,
  size = 'medium',
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  
  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };
  
  // Get avatar size
  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      default:
        return 48;
    }
  };
  
  // Get font size based on avatar size
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 18;
      case 'large':
        return 24;
      default:
        return 18;
    }
  };
  
  const avatarSize = getAvatarSize();
  const fontSize = getFontSize();
  
  // Safely combine styles for web compatibility
  const containerStyles = StyleSheet.flatten([
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: imageUrl ? 'transparent' : `${colors.primary}20`,
    },
    style,
  ]);
  
  const imageStyles = StyleSheet.flatten([
    styles.image,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
  ]);
  
  const initialsStyles = StyleSheet.flatten([
    styles.initials,
    {
      fontSize,
      color: colors.primary,
    },
  ]);
  
  return (
    <View style={containerStyles}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={imageStyles}
        />
      ) : (
        <Text style={initialsStyles}>
          {getInitials()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '600',
  },
});