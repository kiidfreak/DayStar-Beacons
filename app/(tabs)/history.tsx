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
  const { attendanceRecords, courses } = useAttendanceStore();
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Format date for comparison
  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Get dates with attendance records for calendar marking
  const datesWithRecords = attendanceRecords.map(record => new Date(record.date));
  
  // Filter records based on selected course and date
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesCourse = selectedFilter ? record.courseCode === selectedFilter : true;
    const matchesDate = formatDateForComparison(new Date(record.date)) === formatDateForComparison(selectedDate);
    return matchesCourse && matchesDate;
  });
  
  // Format selected date for display
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
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
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={datesWithRecords}
        />
      )}
      
      <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleContainer}>
            <Feather name="filter" size={16} color={colors.primary} />
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              Filter by Course
            </Text>
          </View>
          
          {selectedFilter && (
            <TouchableOpacity 
              onPress={() => setSelectedFilter(null)}
              style={styles.clearButton}
            >
              <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollableFilters 
          courses={courses} 
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          colors={colors}
        />
      </View>
      
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Attendance History {selectedFilter ? `(${courses.find(c => c.id === selectedFilter)?.code})` : ''}
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
                selectedFilter 
                  ? `No attendance records for this course on ${formattedSelectedDate}`
                  : `No attendance records found for ${formattedSelectedDate}`
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

function ScrollableFilters({ 
  courses, 
  selectedFilter, 
  onSelectFilter,
  colors
}: { 
  courses: any[], 
  selectedFilter: string | null, 
  onSelectFilter: (id: string) => void,
  colors: any
}) {
  return (
    <View style={styles.filtersScrollContainer}>
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              { 
                backgroundColor: selectedFilter === item.id ? colors.primary : colors.card,
                borderColor: selectedFilter === item.id ? colors.primary : colors.border,
              }
            ]}
            onPress={() => onSelectFilter(item.id)}
          >
            <Text 
              style={[
                styles.filterChipText,
                { color: selectedFilter === item.id ? 'white' : colors.text }
              ]}
            >
              {item.code}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filtersContent}
      />
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersScrollContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
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