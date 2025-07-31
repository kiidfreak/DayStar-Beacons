import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Course {
  id: string;
  title: string;
  code: string;
  credits: number;
}

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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

  // Mock data - replace with actual data from your stores/services
  const mockCourses: Course[] = [
    { id: '1', title: 'Data Structures & Algorithms', code: 'CS 201', credits: 3 },
    { id: '2', title: 'Database Systems', code: 'CS 301', credits: 3 },
    { id: '3', title: 'Software Engineering', code: 'CS 401', credits: 4 },
    { id: '4', title: 'Computer Networks', code: 'CS 305', credits: 3 },
  ];

  const totalCredits = mockCourses.reduce((sum, course) => sum + course.credits, 0);

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

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    console.log('Edit profile pressed');
  };

  const handleChangeDevice = () => {
    // Navigate to device binding screen
    console.log('Change device pressed');
  };

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
            My Profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your account information
          </Text>
        </Animated.View>

        {/* Profile Cards */}
        <Animated.View 
          style={[
            styles.cardsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* User Profile Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <View style={[styles.profileImage, { backgroundColor: colors.primary }]}>
                  <Text style={styles.profileInitial}>
                    {user?.name?.charAt(0) || 'J'}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user?.name || 'John Doe'}
                </Text>
                <TouchableOpacity 
                  style={[styles.editButton, { borderColor: colors.border }]}
                  onPress={handleEditProfile}
                >
                  <Feather name="edit-2" size={14} color={colors.textSecondary} />
                  <Text style={[styles.editButtonText, { color: colors.textSecondary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {user?.email || 'john.doe@student.uon.ac.ke'}
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  +254 700 123 456
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  University of Nairobi
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  ST/2024/001
                </Text>
              </View>
            </View>
          </View>

          {/* Device Binding Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cellphone" size={20} color={colors.primary} />
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Device Binding
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Your attendance device registration status
                </Text>
              </View>
            </View>

            <View style={styles.deviceStatus}>
              <View style={styles.deviceInfo}>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.deviceStatusText, { color: colors.text }]}>
                    Device Registered
                  </Text>
                  <View style={[styles.activeTag, { backgroundColor: colors.primary }]}>
                    <Text style={styles.activeTagText}>Active</Text>
                  </View>
                </View>
                <Text style={[styles.deviceDetails, { color: colors.textSecondary }]}>
                  John's iPhone 15 • Active now
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.changeDeviceButton, { borderColor: colors.border }]}
                onPress={handleChangeDevice}
              >
                <Text style={[styles.changeDeviceText, { color: colors.text }]}>
                  Change Device
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Enrolled Courses Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.primary} />
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Enrolled Courses
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Current semester courses ({totalCredits} total credits)
                </Text>
              </View>
            </View>

            <View style={styles.coursesList}>
              {mockCourses.map((course, index) => (
                <View key={course.id} style={[styles.courseItem, { backgroundColor: colors.background }]}>
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>
                      {course.title}
                    </Text>
                    <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                      {course.code}
                    </Text>
                  </View>
                  <View style={[styles.creditsTag, { backgroundColor: colors.border }]}>
                    <Text style={[styles.creditsText, { color: colors.text }]}>
                      {course.credits} credits
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  deviceStatus: {
    gap: 16,
  },
  deviceInfo: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceStatusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  deviceDetails: {
    fontSize: 14,
    marginLeft: 28,
  },
  changeDeviceButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  changeDeviceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  coursesList: {
    gap: 12,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 12,
  },
  creditsTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 