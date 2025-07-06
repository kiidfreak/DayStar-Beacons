import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const { width: screenWidth } = Dimensions.get('window');

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
  absentCount 
}: AttendanceStatsProps) {
  const { colors } = useTheme();

  const presentPercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  const latePercentage = totalClasses > 0 ? Math.round((lateCount / totalClasses) * 100) : 0;
  const absentPercentage = totalClasses > 0 ? Math.round((absentCount / totalClasses) * 100) : 0;

  const stats = [
    {
      label: 'Present',
      count: presentCount,
      percentage: presentPercentage,
      color: colors.success,
      icon: 'check-circle',
    },
    {
      label: 'Late',
      count: lateCount,
      percentage: latePercentage,
      color: colors.warning,
      icon: 'clock-alert',
    },
    {
      label: 'Absent',
      count: absentCount,
      percentage: absentPercentage,
      color: colors.error,
      icon: 'close-circle',
    },
  ];

  return (
    <Card elevated style={[styles.container, { backgroundColor: colors.card }] as any}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Attendance Overview
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalClasses} total classes
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
              <MaterialCommunityIcons 
                name={stat.icon as any} 
                size={20} 
                color={stat.color} 
              />
            </View>
            
            <View style={styles.statContent}>
              <Text style={[styles.statCount, { color: colors.text }]}>
                {stat.count}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statPercentage, { color: stat.color }]}>
                {stat.percentage}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {totalClasses > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.success,
                  width: `${presentPercentage}%`
                }
              ]} 
            />
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.warning,
                  width: `${latePercentage}%`
                }
              ]} 
            />
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.error,
                  width: `${absentPercentage}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Overall: {presentPercentage}% present
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: screenWidth > 400 ? 20 : 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: screenWidth > 400 ? 24 : 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statPercentage: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});