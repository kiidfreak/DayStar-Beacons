import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface CalendarViewProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  markedDates?: Date[];
}

export default function CalendarView({ 
  onSelectDate, 
  selectedDate,
  markedDates = []
}: CalendarViewProps) {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Format date as YYYY-MM-DD for comparison
  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Check if a date is marked
  const isDateMarked = (date: Date) => {
    const dateStr = formatDateForComparison(date);
    return markedDates.some(markedDate => 
      formatDateForComparison(markedDate) === dateStr
    );
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Check if a date is selected
  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Render calendar days
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const marked = isDateMarked(date);
      const today = isToday(date);
      const selected = isSelected(date);
      
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            today && [styles.todayCell, { borderColor: colors.primary }],
            selected && [styles.selectedCell, { backgroundColor: colors.primary }],
          ]}
          onPress={() => onSelectDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              { color: colors.text },
              today && { fontWeight: '700', color: colors.primary },
              selected && { color: 'white' },
            ]}
          >
            {day}
          </Text>
          {marked && (
            <View
              style={[
                styles.markerDot,
                { backgroundColor: selected ? 'white' : colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  // Get month name and year
  const getMonthName = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Render weekday headers
  const renderWeekdayHeaders = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return weekdays.map((weekday, index) => (
      <View key={`weekday-${index}`} style={styles.weekdayCell}>
        <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>
          {weekday}
        </Text>
      </View>
    ));
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={24} color="currentColor" />
        </TouchableOpacity>
        
        <Text style={[styles.monthText, { color: colors.text }]}>
          {getMonthName()}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={24} color="currentColor" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdayHeader}>
        {renderWeekdayHeaders()}
      </View>
      
      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayText: {
    fontSize: 14,
  },
  todayCell: {
    borderWidth: 1,
    borderRadius: 20,
  },
  selectedCell: {
    borderRadius: 20,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});