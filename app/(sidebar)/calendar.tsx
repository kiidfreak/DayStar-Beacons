import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import CalendarView from '@/components/CalendarView';
import ClassCard from '@/components/ClassCard';
import EmptyState from '@/components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function CalendarScreen() {
  const { courses, attendanceRecords } = useAttendanceStore();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Format date for comparison
  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Get dates with attendance records for calendar marking
  const datesWithRecords = attendanceRecords.map(record => new Date(record.date));
  
  // Get day of week for selected date
  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  // Get courses for selected day
  const getCoursesForDay = (date: Date) => {
    const dayOfWeek = getDayOfWeek(date);
    return courses.filter(course => course.days?.includes(dayOfWeek));
  };
  
  // Get courses for selected date
  const coursesForSelectedDay = getCoursesForDay(selectedDate);
  
  // Format selected date for display
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  // Debug logs
  console.log('courses:', courses);
  console.log('selectedDate:', selectedDate);
  console.log('coursesForSelectedDay:', coursesForSelectedDay);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          Calendar
        </Text>
      </View>
      
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        markedDates={datesWithRecords}
      />
      
      <View style={styles.dayContainer}>
        <Text style={[styles.dateTitle, { color: colors.text }]}>
          {formattedSelectedDate}
        </Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.coursesList}
        >
          {coursesForSelectedDay.length > 0 ? (
            coursesForSelectedDay.map(course => (
              <ClassCard 
                key={course.id} 
                course={course}
                onPress={() => {}}
              />
            ))
          ) : (
            <Card elevated style={styles.emptyCard}>
              <EmptyState
                icon={<MaterialCommunityIcons name="calendar" size={24} color="currentColor" />}
                title="No Classes"
                message={`You don't have any classes scheduled for ${formattedSelectedDate}`}
                actionLabel="View All Courses"
                onAction={() => {}}
              />
            </Card>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  dayContainer: {
    flex: 1,
    marginTop: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  coursesList: {
    paddingBottom: 24,
  },
  emptyCard: {
    padding: 0,
    overflow: 'hidden',
  },
});