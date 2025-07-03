import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { CourseService } from '@/services/courseService';
import { ClassSession } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import CalendarView from '@/components/CalendarView';
import ClassCard from '@/components/ClassCard';
import EmptyState from '@/components/EmptyState';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

console.log('CALENDAR PAGE: (sidebar)');

export default function CalendarScreen() {
  const user = useAuthStore((state) => state.user);
  const studentId = user?.id;
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allSessions, setAllSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    CourseService.getAllSessionsForStudent(studentId)
      .then(setAllSessions)
      .catch((err) => setError(err.message || 'Failed to fetch sessions'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const markedDates = allSessions.map(s => new Date(s.sessionDate));
  const sessionsForSelectedDate = allSessions.filter(
    s => s.sessionDate.slice(0, 10) === selectedDate.toISOString().slice(0, 10)
  );
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Class Sessions</Text>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: colors.card,
            borderColor: colors.border,
            gap: 12,
          }}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Feather name="calendar" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>{formattedSelectedDate}</Text>
        </TouchableOpacity>
      </View>
      {showCalendar && (
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={date => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
          markedDates={markedDates}
        />
      )}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.text }}>
          Sessions {formattedSelectedDate ? `(${formattedSelectedDate})` : ''}
        </Text>
        {loading && <ActivityIndicator size="large" color={colors.primary} />}
        {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
        {!loading && sessionsForSelectedDate.length > 0 ? (
          <FlatList
            data={sessionsForSelectedDate}
            keyExtractor={item => item.id}
            renderItem={({ item: session }) => (
              <Card elevated style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{session.course?.name || 'Course'}</Text>
                <Text style={{ color: colors.textSecondary }}>Time: {session.startTime} - {session.endTime}</Text>
                <Text style={{ color: colors.textSecondary }}>Location: {session.location || 'TBA'}</Text>
                <Text style={{ color: colors.textSecondary }}>Type: {session.sessionType}</Text>
              </Card>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        ) : !loading ? (
          <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
            <EmptyState
              icon={<MaterialCommunityIcons name="calendar" size={32} color={colors.primary} />}
              title="No Sessions Found"
              message={`No class sessions scheduled for ${formattedSelectedDate}`}
              actionLabel="Change Date"
              onAction={() => setShowCalendar(true)}
            />
          </Card>
        ) : null}
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