import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import Card from '@/components/ui/Card';

interface AttendanceStatsProps {
  totalClasses: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

export default function AttendanceStats({
  totalClasses,
  presentCount,
  lateCount,
  absentCount,
}: AttendanceStatsProps) {
  const { colors } = useTheme();
  
  // Calculate attendance rate
  const attendanceRate = totalClasses > 0 
    ? Math.round(((presentCount + lateCount) / totalClasses) * 100) 
    : 0;
  
  // Determine attendance status color
  const getStatusColor = (rate: number) => {
    if (rate >= 90) return colors.success;
    if (rate >= 75) return colors.primary;
    if (rate >= 60) return colors.warning;
    return colors.error;
  };
  
  const statusColor = getStatusColor(attendanceRate);
  
  return (
    <Card elevated style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Attendance Overview
        </Text>
        <View style={[styles.rateContainer, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.rateText, { color: statusColor }]}>
            {attendanceRate}%
          </Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalClasses}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {presentCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Present
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {lateCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Late
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {absentCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Absent
          </Text>
        </View>
      </View>
      
      <View style={[styles.progressContainer, { backgroundColor: `${statusColor}20` }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${attendanceRate}%`,
              backgroundColor: statusColor
            }
          ]} 
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  rateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E8ECF4',
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});