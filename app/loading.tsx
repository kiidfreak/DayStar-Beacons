import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export default function LoadingScreen() {
  const { themeColors } = useThemeStore();
  const safeThemeColors = themeColors || {
    background: '#FFFFFF',
    text: '#1A1D1F',
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: safeThemeColors.background }}>
      <ActivityIndicator size="large" color={safeThemeColors.text} />
      <Text style={{ marginTop: 16, color: safeThemeColors.text, fontSize: 16 }}>Loading...</Text>
    </View>
  );
}