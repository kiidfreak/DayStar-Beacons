import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceStore } from '@/store/attendanceStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const { width: screenWidth } = Dimensions.get('window');

interface BeaconStatusProps {
  beaconErrorReason?: string;
}

export default function BeaconStatus({ beaconErrorReason }: BeaconStatusProps) {
  const { colors } = useTheme();
  const { currentBeaconStatus } = useAttendanceStore();

  const getStatusConfig = () => {
    switch (currentBeaconStatus) {
      case 'connected':
        return {
          icon: 'wifi',
          color: colors.success,
          title: 'Connected to Class',
          subtitle: 'Attendance tracking active',
          backgroundColor: `${colors.success}15`,
        };
      case 'scanning':
        return {
          icon: 'wifi-search',
          color: colors.primary,
          title: 'Searching for Class',
          subtitle: 'Please ensure you are in the classroom',
          backgroundColor: `${colors.primary}15`,
        };
      case 'error':
        return {
          icon: 'wifi-off',
          color: colors.error,
          title: 'Connection Error',
          subtitle: beaconErrorReason || 'Unable to connect to class',
          backgroundColor: `${colors.error}15`,
        };
      default:
        return {
          icon: 'wifi-off',
          color: colors.textSecondary,
          title: 'Not Connected',
          subtitle: 'No active class session detected',
          backgroundColor: `${colors.textSecondary}15`,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card elevated style={[styles.container, { backgroundColor: colors.card }] as any}>
      <View style={[styles.statusContainer, { backgroundColor: statusConfig.backgroundColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: statusConfig.color }]}>
          <MaterialCommunityIcons 
            name={statusConfig.icon as any} 
            size={24} 
            color="white" 
          />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            {statusConfig.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {statusConfig.subtitle}
          </Text>
          

        </View>
        
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: screenWidth > 400 ? 16 : 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionInfo: {
    marginTop: 8,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});