import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';

interface StatsData {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  thisWeek: number;
  thisMonth: number;
}

export function AttendanceStats() {
  const { attendanceRecords } = useAttendanceStore();
  const { themeColors } = useThemeStore();
  const [stats, setStats] = useState<StatsData>({
    totalSessions: 0,
    attendedSessions: 0,
    attendanceRate: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [attendanceRecords]);

  const calculateStats = () => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.check_in_time);
      return recordDate >= weekStart;
    });

    const thisMonthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.check_in_time);
      return recordDate >= monthStart;
    });

    const totalSessions = attendanceRecords.length;
    const attendedSessions = attendanceRecords.filter(record => 
      record.status === 'present'
    ).length;

    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

    setStats({
      totalSessions,
      attendedSessions,
      attendanceRate: Math.round(attendanceRate),
      thisWeek: thisWeekRecords.length,
      thisMonth: thisMonthRecords.length,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="chart-line" 
          size={24} 
          color={themeColors.primary} 
        />
        <Text style={[styles.title, { color: themeColors.text }]}>
          Attendance Stats
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {stats.attendanceRate}%
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Attendance Rate
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.success }]}>
            {stats.attendedSessions}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Sessions Attended
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.warning }]}>
            {stats.thisWeek}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            This Week
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.secondary }]}>
            {stats.thisMonth}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            This Month
          </Text>
        </View>
      </View>

      {stats.totalSessions > 0 && (
        <View style={styles.summary}>
          <Text style={[styles.summaryText, { color: themeColors.textSecondary }]}>
            Total Sessions: {stats.totalSessions}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  summary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryText: {
    fontSize: 12,
    textAlign: 'center',
  },
});