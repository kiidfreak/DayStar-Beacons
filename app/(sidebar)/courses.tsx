import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTheme } from '@/hooks/useTheme';
import ClassCard from '@/components/ClassCard';
import EmptyState from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

export default function CoursesScreen() {
  const router = useRouter();
  const { courses } = useAttendanceStore();
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Filter courses based on selected day and search query
  const filteredCourses = courses.filter(course => {
    const matchesDay = selectedDay ? course.days?.includes(selectedDay) : true;
    const matchesSearch = searchQuery 
      ? course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesDay && matchesSearch;
  });
  
  // Navigate to course details
  const handleCoursePress = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          My Courses
        </Text>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search courses..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleContainer}>
            <Feather name="filter" size={16} color={colors.primary} />
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              Filter by Day
            </Text>
          </View>
          
          {selectedDay && (
            <TouchableOpacity 
              onPress={() => setSelectedDay(null)}
              style={styles.clearButton}
            >
              <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={days}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.dayChip,
                { 
                  backgroundColor: selectedDay === item ? colors.primary : colors.card,
                  borderColor: selectedDay === item ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedDay(item)}
            >
              <Text 
                style={[
                  styles.dayChipText,
                  { color: selectedDay === item ? 'white' : colors.text }
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.daysContainer}
        />
      </View>
      
      <View style={styles.coursesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {searchQuery 
            ? `Search Results${selectedDay ? ` (${selectedDay})` : ''}`
            : `All Courses${selectedDay ? ` (${selectedDay})` : ''}`}
        </Text>
        
        {filteredCourses.length > 0 ? (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ClassCard 
                course={item} 
                onPress={() => handleCoursePress(item.id)}
                showAttendanceRate
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.coursesList}
          />
        ) : (
          <Card elevated style={styles.emptyCard}>
            <EmptyState
              icon={<Feather name="book-open" size={32} color={colors.primary} />}
              title="No Courses Found"
              message={searchQuery 
                ? "Try adjusting your search or filters" 
                : selectedDay 
                  ? `You don't have any courses on ${selectedDay}` 
                  : "You haven't enrolled in any courses yet"}
              actionLabel={searchQuery || selectedDay ? "Clear Filters" : undefined}
              onAction={searchQuery || selectedDay 
                ? () => {
                    setSearchQuery('');
                    setSelectedDay(null);
                  } 
                : undefined}
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  daysContainer: {
    paddingRight: 16,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  coursesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
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