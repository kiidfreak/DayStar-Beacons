import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BeaconStatus } from '@/components/BeaconStatus';
import { AttendanceStats } from '@/components/AttendanceStats';
import { useBeacon } from '@/hooks/useBeacon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const { isScanning, currentSession, attendanceMarked, isConnected } = useBeacon();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  console.log('HomeScreen: Rendering with user:', user?.id);

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

  useEffect(() => {
    console.log('HomeScreen: useEffect triggered with user:', user?.id);
    if (user) {
      console.log('HomeScreen: Fetching attendance records for user:', user.id);
      fetchAttendanceRecords();
      // Optionally, trigger other fetches for courses/stats if needed
    }
  }, [user, fetchAttendanceRecords]);

  // Refresh attendance records when component mounts or user changes
  useEffect(() => {
    if (user) {
      const refreshData = async () => {
        try {
          await fetchAttendanceRecords();
        } catch (error) {
          console.error('Error refreshing attendance records:', error);
        }
      };
      refreshData();
    }
  }, [user]);

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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/qr-scanner');
        break;
      case 'courses':
        router.push('/(tabs)/courses');
        break;
      case 'history':
        router.push('/(tabs)/history');
        break;
      default:
        break;
    }
  };

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // Mock data for today's classes
  const todaysClasses = [
    {
      id: 1,
      title: "Introduction to Computer Science",
      code: "CS 101",
      time: "08:00 - 10:00",
      location: "Science Block, Room 201",
      lecturer: "Dr. James Kimani",
      day: "Monday",
      isExpanded: expandedCard === 0,
    },
    {
      id: 2,
      title: "Advanced Calculus",
      code: "MATH 202",
      time: "10:30 - 12:30",
      location: "Mathematics Building, Room 105",
      lecturer: "Prof. Sarah Odhiambo",
      day: "Monday",
      isExpanded: expandedCard === 1,
    },
    {
      id: 3,
      title: "Literary Theory",
      code: "ENG 303",
      time: "14:00 - 16:00",
      location: "Arts Block, Room A12",
      lecturer: "Dr. Michael Ochieng",
      day: "Monday",
      isExpanded: expandedCard === 2,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


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
            Attendance Check
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getCurrentDate()}
          </Text>
        </Animated.View>

        {/* Today's Classes Section */}
        <Animated.View 
          style={[
            styles.classesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Classes
          </Text>
          
          {todaysClasses.map((classItem, index) => (
            <View key={classItem.id} style={[styles.classCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.classHeader}
                onPress={() => toggleCardExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.classInfo}>
                  <Text style={[styles.classTitle, { color: colors.text }]}>
                    {classItem.title}
                  </Text>
                </View>
                <View style={styles.classHeaderRight}>
                  <View style={[styles.classCode, { backgroundColor: colors.primary }]}>
                    <Text style={styles.classCodeText}>{classItem.code}</Text>
                  </View>
                  <Ionicons 
                    name={classItem.isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
              
              <View style={styles.classDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>{classItem.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>{classItem.location}</Text>
                </View>
                {classItem.isExpanded && (
                  <>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>Lecturer: {classItem.lecturer}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.text }]}>Day: {classItem.day}</Text>
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Check In</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Check Out</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
                        <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.textSecondary} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Scan QR</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
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
  classesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  classCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  classHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classCode: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  classCodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 