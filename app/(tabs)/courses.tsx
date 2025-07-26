import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  console.log('CoursesScreen: Rendering with user:', user?.id);

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#3B82F6',
    secondary: '#2563EB',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    inactive: '#9CA3AF',
    highlight: '#EFF6FF',
  };

  // Animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Mock timetable data
  const timetableData = [
    {
      day: 'Monday',
      classes: [
        {
          title: 'Introduction to Computer Science',
          time: '08:00 - 10:00',
          location: 'Science Block, Room 201',
          instructor: 'Dr. James Kimani',
        },
        {
          title: 'Advanced Calculus',
          time: '10:30 - 12:30',
          location: 'Mathematics Building, Room 105',
          instructor: 'Prof. Sarah Odhiambo',
        },
      ],
    },
    {
      day: 'Tuesday',
      classes: [],
    },
    {
      day: 'Wednesday',
      classes: [
        {
          title: 'Database Systems',
          time: '14:00 - 16:00',
          location: 'Computer Lab, Room 301',
          instructor: 'Dr. Michael Ochieng',
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTitle, { color: colors.primary }]}>Tcheck</Text>
              <Text style={[styles.logoSubtitle, { color: colors.textSecondary }]}>Student Attendance</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Main Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            My Timetable
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getCurrentDate()}
          </Text>
        </Animated.View>

        {/* Timetable Cards */}
        <Animated.View 
          style={[
            styles.timetableContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {timetableData.map((dayData, index) => (
            <View key={index} style={[styles.dayCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.dayTitle, { color: colors.primary }]}>
                {dayData.day}
              </Text>
              
              {dayData.classes.length === 0 ? (
                <Text style={[styles.noClassesText, { color: colors.textSecondary }]}>
                  No classes scheduled
                </Text>
              ) : (
                dayData.classes.map((classItem, classIndex) => (
                  <View key={classIndex} style={styles.classItem}>
                    <View style={styles.classHeader}>
                      <Text style={[styles.classTitle, { color: colors.text }]}>
                        {classItem.title}
                      </Text>
                      <Text style={[styles.classTime, { color: colors.textSecondary }]}>
                        {classItem.time}
                      </Text>
                    </View>
                    
                    <View style={styles.classDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          {classItem.location}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          {classItem.instructor}
                        </Text>
                      </View>
                    </View>
                    
                    {classIndex < dayData.classes.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))
              )}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
  },
  titleContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timetableContainer: {
    gap: 16,
  },
  dayCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  noClassesText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  classItem: {
    marginBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  classTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  classDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginTop: 16,
  },
}); 