import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

type HistoryItemProps = {
  record: AttendanceRecord;
};

export default function HistoryItem({ record }: HistoryItemProps) {
  const { colors } = useTheme();
  
  const getStatusInfo = () => {
    switch (record.status) {
      case 'verified':
        return {
          icon: <Feather name="check" size={24} color={colors.success} />,
          text: 'Present',
          color: colors.success,
          backgroundColor: `${colors.success}15`
        };
      case 'pending':
        return {
          icon: <MaterialCommunityIcons name="qrcode" size={24} color={colors.warning} />,
          text: 'QR Check-in',
          color: colors.warning,
          backgroundColor: `${colors.warning}15`
        };
      case 'late':
        return {
          icon: <Feather name="alert-triangle" size={24} color={colors.warning} />,
          text: 'Late',
          color: colors.warning,
          backgroundColor: `${colors.warning}15`
        };
      case 'absent':
        return {
          icon: <Feather name="x" size={24} color={colors.error} />,
          text: 'Absent',
          color: colors.error,
          backgroundColor: `${colors.error}15`
        };
      default:
        return {
          icon: <Feather name="check" size={24} color={colors.success} />,
          text: 'Present',
          color: colors.success,
          backgroundColor: `${colors.success}15`
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // Format date to display as "Mon, Jun 10"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <Card elevated style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(record.date)}
        </Text>
        <Text style={[styles.courseName, { color: colors.text }]}>
          {record.courseName}
        </Text>
        <Text style={[styles.courseCode, { color: colors.primary }]}>
          {record.courseCode}
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          Arrival time: {record.checkInTime}
        </Text>
        <View style={[styles.statusContainer, { backgroundColor: statusInfo.backgroundColor }]}>
          {statusInfo.icon}
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 14,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});