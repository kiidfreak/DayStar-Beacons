import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Course } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type ClassCardProps = {
  course: Course;
  isActive?: boolean;
  onPress?: () => void;
  showAttendanceRate?: boolean;
};

export default function ClassCard({ 
  course, 
  isActive = false, 
  onPress,
  showAttendanceRate = false
}: ClassCardProps) {
  const { colors } = useTheme();
  
  // Safely create styles for web compatibility
  const containerStyle = StyleSheet.flatten([
    styles.container,
    isActive && { borderColor: colors.primary }
  ]);
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card 
          gradient={isActive}
          elevated
          style={containerStyle}
        >
          <View style={styles.header}>
            <View style={styles.codeContainer}>
              <Text style={[styles.courseCode, { color: colors.primary }]}>
                {course.code}
              </Text>
              {showAttendanceRate && (
                <Badge 
                  text="85% Attendance" 
                  variant="success" 
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
            
            {isActive && (
              <Badge 
                text="In Progress" 
                variant="primary" 
                icon={<View style={[styles.activeDot, { backgroundColor: 'white' }]} />}
              />
            )}
          </View>
          
          <Text style={[styles.courseName, { color: colors.text }]}>
            {course.name}
          </Text>
          
          <Text style={[styles.instructor, { color: colors.textSecondary }]}>
            {course.instructorName || (course.instructor ? course.instructor.name : 'Unknown Instructor')}
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock" size={24} color="currentColor" />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {course.schedule}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={24} color="currentColor" />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {course.room}
              </Text>
            </View>
            
            {course.days && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar" size={24} color="currentColor" />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {course.days.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  }
  return (
    <Card 
      gradient={isActive}
      elevated
      style={containerStyle}
    >
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <Text style={[styles.courseCode, { color: colors.primary }]}>
            {course.code}
          </Text>
          {showAttendanceRate && (
            <Badge 
              text="85% Attendance" 
              variant="success" 
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        
        {isActive && (
          <Badge 
            text="In Progress" 
            variant="primary" 
            icon={<View style={[styles.activeDot, { backgroundColor: 'white' }]} />}
          />
        )}
      </View>
      
      <Text style={[styles.courseName, { color: colors.text }]}>
        {course.name}
      </Text>
      
      <Text style={[styles.instructor, { color: colors.textSecondary }]}>
        {course.instructorName || (course.instructor ? course.instructor.name : 'Unknown Instructor')}
      </Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="clock" size={24} color="currentColor" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {course.schedule}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="map-marker" size={24} color="currentColor" />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {course.room}
          </Text>
        </View>
        
        {course.days && (
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar" size={24} color="currentColor" />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {course.days.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  instructor: {
    fontSize: 14,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
  },
});