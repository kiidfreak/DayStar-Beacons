import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import Card from '@/components/ui/Card';
import { Feather } from '@expo/vector-icons';

export default function AdminHistoryScreen() {
  const { attendanceRecords, courses } = useAttendanceStore();
  const { colors } = useTheme();

  // Filter/search state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Unique statuses
  const statuses = ['verified', 'pending', 'absent', 'late'];

  // Filtered records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchQuery
      ? (record.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         record.courseName?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesCourse = selectedCourse ? record.courseCode === selectedCourse : true;
    const matchesStatus = selectedStatus ? record.status === selectedStatus : true;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Attendance History</Text>
      <TouchableOpacity
        style={[styles.filterToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setFiltersOpen(open => !open)}
      >
        <Feather name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
        <Text style={[styles.filterToggleText, { color: colors.primary }]}>Filters & Search</Text>
      </TouchableOpacity>
      {filtersOpen && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Search by student or course..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterRow}>
            <View style={styles.filterCol}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Course</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setSelectedCourse(null)}
                >
                  <Text style={{ color: !selectedCourse ? colors.primary : colors.text }}>All</Text>
                </TouchableOpacity>
                {courses.map(course => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setSelectedCourse(course.code)}
                  >
                    <Text style={{ color: selectedCourse === course.code ? colors.primary : colors.text }}>{course.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterCol}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setSelectedStatus(null)}
                >
                  <Text style={{ color: !selectedStatus ? colors.primary : colors.text }}>All</Text>
                </TouchableOpacity>
                {statuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={{ color: selectedStatus === status ? colors.primary : colors.text }}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
      <FlatList
        data={filteredRecords}
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
              Status: {item.status}
            </Text>
            <Text style={[styles.info, { color: colors.text }]}>
              Check-in: {item.checkInTime}
            </Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, marginTop: 24 }}>No records found.</Text>}
      />
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  filterCol: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  info: {
    fontSize: 16,
    marginBottom: 4,
  },
}); 