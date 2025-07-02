import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import HistoryItem from '@/components/HistoryItem';
import CalendarView from '@/components/CalendarView';
import EmptyState from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function HistoryScreen() {
  const { attendanceRecords } = useAttendanceStore();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Debug logs
  console.log('attendanceRecords:', attendanceRecords);
  
  // Format date for comparison
  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Get dates with attendance records for calendar marking
  const datesWithRecords = attendanceRecords.map(record => new Date(record.date));
  
  // Filter records based on selected date only
  const filteredRecords = (!selectedDate)
    ? attendanceRecords
    : attendanceRecords.filter(record => {
        return formatDateForComparison(new Date(record.date)) === formatDateForComparison(selectedDate);
      });
  
  // Debug log for filtered records
  console.log('filteredRecords:', filteredRecords);
  
  // Format selected date for display
  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : 'All Dates';
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.dateSelector, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Feather name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formattedSelectedDate}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showCalendar && (
        <CalendarView
          selectedDate={selectedDate || new Date()}
          onSelectDate={setSelectedDate}
          markedDates={datesWithRecords}
        />
      )}
      
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Attendance History
        </Text>
        
        {filteredRecords.length > 0 ? (
          <FlatList
            data={filteredRecords}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <HistoryItem record={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <Card elevated style={styles.emptyCard}>
            <EmptyState
              icon={<Feather name="clock" size={32} color={colors.primary} />}
              title="No Records Found"
              message={
                selectedDate
                  ? `No attendance records for ${formattedSelectedDate}`
                  : `No attendance records found.`
              }
              actionLabel="Change Date"
              onAction={() => setShowCalendar(true)}
            />
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyCard: {
    padding: 0,
    overflow: 'hidden',
  },
});