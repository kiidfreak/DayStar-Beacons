import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function BeaconStatus() {
  const { currentBeaconStatus } = useAttendanceStore();
  const { colors } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (currentBeaconStatus === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentBeaconStatus, pulseAnim]);
  
  const getStatusInfo = () => {
    switch (currentBeaconStatus) {
      case 'scanning':
        return {
          icon: <Feather name="wifi" size={24} color={colors.primary} />,
          text: "Scanning for beacons...",
          color: colors.primary
        };
      case 'detected':
        return {
          icon: <Feather name="wifi" size={24} color={colors.primary} />,
          text: "Beacon detected",
          color: colors.primary
        };
      case 'connected':
        return {
          icon: <Feather name="check" size={24} color={colors.success} />,
          text: "Connected to beacon",
          color: colors.success
        };
      case 'error':
        return {
          icon: <Feather name="alert-circle" size={24} color={colors.error} />,
          text: "Error connecting to beacon",
          color: colors.error
        };
      case 'inactive':
      default:
        return {
          icon: <Feather name="wifi-off" size={24} color={colors.inactive} />,
          text: "Beacon scanning inactive",
          color: colors.inactive
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Card style={styles.container} elevated>
      <Animated.View
        style={[
          styles.iconContainer,
          { 
            borderColor: statusInfo.color,
            transform: [{ scale: currentBeaconStatus === 'scanning' ? pulseAnim : 1 }]
          }
        ]}
      >
        {statusInfo.icon}
      </Animated.View>
      <Text style={[styles.statusText, { color: statusInfo.color }]}>
        {statusInfo.text}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  }
});