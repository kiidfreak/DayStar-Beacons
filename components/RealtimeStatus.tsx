import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface RealtimeStatusProps {
  isConnected: boolean;
  subscriptionCount: number;
}

export default function RealtimeStatus({ isConnected, subscriptionCount }: RealtimeStatusProps) {
  const { colors } = useTheme();

  if (!isConnected) {
    return null; // Don't show anything if not connected
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Feather name="wifi" size={12} color="white" />
      <Text style={styles.text}>Live Updates</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{subscriptionCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  text: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
}); 