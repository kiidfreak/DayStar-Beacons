import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function QRApprovalsScreen() {
  const { attendanceRecords, setAttendanceRecords, isLoadingAttendance, fetchAllAttendanceRecords } = useAttendanceStore();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllAttendanceRecords();
    }
  }, [user, fetchAllAttendanceRecords]);

  // Debug logs
  console.log('attendanceRecords:', attendanceRecords);

  // Filter for pending QR check-ins
  const pendingRecords = attendanceRecords.filter(r => r.status === 'pending');
  console.log('pendingRecords:', pendingRecords);

  // Approve handler
  const handleApprove = (id: string) => {
    setAttendanceRecords(
      attendanceRecords.map(r =>
        r.id === id ? { ...r, status: 'verified' } : r
      )
    );
    Alert.alert('Approved', 'Attendance has been approved.');
  };
  // Reject handler
  const handleReject = (id: string) => {
    setAttendanceRecords(
      attendanceRecords.map(r =>
        r.id === id ? { ...r, status: 'absent' } : r
      )
    );
    Alert.alert('Rejected', 'Attendance has been rejected.');
  };

  if (isLoadingAttendance) {
    return <Text style={{ color: colors.text }}>Loading...</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* TEST: Visible test element to confirm rendering */}
      <View style={{ backgroundColor: 'yellow', padding: 16, marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ color: 'black', fontSize: 24 }}>ADMIN APPROVALS PAGE</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>QR Fallback Approvals</Text>
      {pendingRecords.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No pending QR check-ins.</Text>
      ) : (
        <FlatList
          data={pendingRecords}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card elevated style={styles.card}>
              <Text style={[styles.info, { color: colors.text }]}>
                Student: {item.studentId}
              </Text>
              <Text style={[styles.info, { color: colors.text }]}>
                Course: {item.courseName}
              </Text>
              <Text style={[styles.info, { color: colors.text }]}>
                Session: {item.sessionId}
              </Text>
              <Text style={[styles.info, { color: colors.text }]}>
                Check-in: {item.checkInTime}
              </Text>
              <View style={styles.actions}>
                <Button title="Approve" onPress={() => handleApprove(item.id)} variant="primary" size="small" />
                <Button title="Reject" onPress={() => handleReject(item.id)} variant="outline" size="small" style={{ marginLeft: 8 }} />
              </View>
            </Card>
          )}
        />
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
  card: {
    marginBottom: 16,
    padding: 16,
  },
  info: {
    fontSize: 16,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
}); 