import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function AdminReportsScreen() {
  const { attendanceRecords } = useAttendanceStore();
  const { colors } = useTheme();

  const handleExportCSV = async () => {
    if (!attendanceRecords.length) {
      Alert.alert('No records', 'There are no attendance records to export.');
      return;
    }
    // Generate CSV header and rows
    const header = 'id,studentId,courseName,courseCode,status,checkInTime,date,createdAt';
    const rows = attendanceRecords.map(r => [
      r.id,
      r.studentId,
      r.courseName,
      r.courseCode,
      r.status,
      r.checkInTime,
      r.date,
      r.createdAt
    ].map(field => `"${field ?? ''}"`).join(','));
    const csv = [header, ...rows].join('\n');

    if (Platform.OS === 'web') {
      // Web: trigger file download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Mobile: save to file and share (if possible), else show in alert
      try {
        const fileUri = FileSystem.cacheDirectory + 'attendance_report.csv';
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('CSV Data', csv.slice(0, 1000) + (csv.length > 1000 ? '\n...truncated' : ''));
        }
      } catch (err) {
        Alert.alert('Export failed', 'Could not export CSV: ' + err);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Attendance Reports</Text>
      <Button title="Export as CSV" onPress={handleExportCSV} variant="primary" style={styles.exportButton} />
      {attendanceRecords.length === 0 ? (
        <Card elevated style={styles.card}>
          <Text style={[styles.info, { color: colors.textSecondary }]}>No attendance records found.</Text>
        </Card>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {attendanceRecords.map(record => (
            <Card key={record.id} style={{ marginBottom: 12, padding: 12 }}>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                {record.courseName} ({record.courseCode})
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Student: {record.studentId} | Status: {record.status}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Date: {record.date} | Checked in: {record.checkInTime || 'N/A'}
              </Text>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  exportButton: {
    marginBottom: 16,
  },
  card: {
    padding: 16,
  },
  info: {
    fontSize: 16,
  },
}); 