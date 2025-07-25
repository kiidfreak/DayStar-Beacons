import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CourseService } from '@/services/courseService';
import { Course } from '@/types';
import { supabase } from '@/lib/supabase';
import { useUniversityStore } from '@/store/universityStore';

const { width: screenWidth } = Dimensions.get('window');

type RegistrationStep = 'personal' | 'courses' | 'review';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { themeColors } = useThemeStore();
  const { university } = useUniversityStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#F7F9FC',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#00AEEF',
    secondary: '#3DDAB4',
    border: '#E8ECF4',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    inactive: '#C5C6C7',
    highlight: '#E6F7FE',
  };

  // Load available courses
  useEffect(() => {
    if (currentStep === 'courses') {
      loadAvailableCourses();
    }
  }, [currentStep]);

  const loadAvailableCourses = async () => {
    setLoadingCourses(true);
    try {
      // Use university id if available, otherwise fetch all courses
      let courses;
      let uniId = university && university.id ? university.id : '';
      let studentId = null;
      console.log('Calling getAvailableCourses with:', { uniId, studentId });
      courses = await CourseService.getAvailableCourses(uniId, studentId);
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load available courses. Please try again.');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCourseSelection = () => {
    if (selectedCourses.length === 0) {
      Alert.alert('Course Selection Required', 'Please select at least one course to continue.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 'personal') {
      if (validateForm()) {
        setCurrentStep('courses');
      }
    } else if (currentStep === 'courses') {
      if (validateCourseSelection()) {
        setCurrentStep('review');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'courses') {
      setCurrentStep('personal');
    } else if (currentStep === 'review') {
      setCurrentStep('courses');
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Handle registration
  const handleRegister = async () => {
    console.log('Starting registration process...');
    if (!validateForm() || !validateCourseSelection()) {
      console.log('Validation failed, stopping registration');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating user account with Supabase Auth...');
      // Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            department: formData.department,
            role: 'student',
          }
        }
      });

      console.log('Auth response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Creating user profile in users table...');
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          role: 'student',
        });

      console.log('Profile creation response:', { profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Enrolling student in selected courses...');
      // Enroll student in selected courses
      const enrollmentPromises = selectedCourses.map(courseId => {
        const enrollmentObj = {
          student_id: authData.user?.id,
          course_id: courseId,
          status: 'active',
          enrollment_date: new Date().toISOString(),
        };
        console.log('Inserting into student_course_enrollments:', enrollmentObj);
        return supabase
          .from('student_course_enrollments')
          .insert(enrollmentObj);
      });

      await Promise.all(enrollmentPromises);
      console.log('Registration completed successfully');

      // Automatically log the user in after successful registration
      console.log('Auto-logging in after registration...');
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('Auto-login error:', signInError);
          // If auto-login fails, redirect to login
          Alert.alert(
            'Registration Successful',
            `Your account has been created successfully! You have been enrolled in ${selectedCourses.length} course(s).\n\nPlease check your email and confirm your account before signing in.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('Navigating to login screen...');
                  router.push('/(auth)/login');
                }
              }
            ]
          );
        } else {
          console.log('Auto-login successful, navigating to tabs');
          // Auto-login successful, navigate to main app
          Alert.alert(
            'Registration Successful',
            `Your account has been created successfully! You have been enrolled in ${selectedCourses.length} course(s). Welcome!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('Navigating to tabs after auto-login...');
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        }
      } catch (autoLoginError) {
        console.error('Auto-login failed:', autoLoginError);
        // Fallback to login screen
        Alert.alert(
          'Registration Successful',
          `Your account has been created successfully! You have been enrolled in ${selectedCourses.length} course(s).\n\nPlease check your email and confirm your account before signing in.`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Navigating to login screen...');
                router.push('/(auth)/login');
              }
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      console.log('Registration process completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep === 'personal' && styles.activeStep]}>
        <Text style={[styles.stepNumber, currentStep === 'personal' && styles.activeStepText]}>1</Text>
        <Text style={[styles.stepLabel, currentStep === 'personal' && styles.activeStepText]}>Personal Info</Text>
      </View>
      <View style={[styles.stepLine, currentStep !== 'personal' && styles.activeStepLine]} />
      <View style={[styles.step, currentStep === 'courses' && styles.activeStep]}>
        <Text style={[styles.stepNumber, currentStep === 'courses' && styles.activeStepText]}>2</Text>
        <Text style={[styles.stepLabel, currentStep === 'courses' && styles.activeStepText]}>Courses</Text>
      </View>
      <View style={[styles.stepLine, currentStep === 'review' && styles.activeStepLine]} />
      <View style={[styles.step, currentStep === 'review' && styles.activeStep]}>
        <Text style={[styles.stepNumber, currentStep === 'review' && styles.activeStepText]}>3</Text>
        <Text style={[styles.stepLabel, currentStep === 'review' && styles.activeStepText]}>Review</Text>
      </View>
    </View>
  );

  const renderPersonalInfoStep = () => (
    <Card elevated style={styles.formCard}>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>First Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.firstName ? colors.error : colors.border 
          }]}
          placeholder="Enter your first name"
          placeholderTextColor={colors.textSecondary}
          value={formData.firstName}
          onChangeText={(value) => updateFormData('firstName', value)}
        />
        {errors.firstName && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.firstName}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Last Name *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.lastName ? colors.error : colors.border 
          }]}
          placeholder="Enter your last name"
          placeholderTextColor={colors.textSecondary}
          value={formData.lastName}
          onChangeText={(value) => updateFormData('lastName', value)}
        />
        {errors.lastName && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.lastName}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Email Address *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.email ? colors.error : colors.border 
          }]}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
        />
        {errors.email && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.email}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.phone ? colors.error : colors.border 
          }]}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
        />
        {errors.phone && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.phone}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Department *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.department ? colors.error : colors.border 
          }]}
          placeholder="Enter your department"
          placeholderTextColor={colors.textSecondary}
          value={formData.department}
          onChangeText={(value) => updateFormData('department', value)}
        />
        {errors.department && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.department}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Password *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.password ? colors.error : colors.border 
          }]}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
        />
        {errors.password && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.password}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            color: colors.text,
            borderColor: errors.confirmPassword ? colors.error : colors.border 
          }]}
          placeholder="Confirm your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(value) => updateFormData('confirmPassword', value)}
        />
        {errors.confirmPassword && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.confirmPassword}
          </Text>
        )}
      </View>
    </Card>
  );

  const renderCourseSelectionStep = () => (
    <Card elevated style={styles.formCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Select Your Courses
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Choose the courses you want to enroll in. You can select multiple courses.
      </Text>

      {loadingCourses ? (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={32} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading available courses...
          </Text>
        </View>
      ) : availableCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="book-open" size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No courses available at the moment.
          </Text>
        </View>
      ) : (
        <View style={styles.courseList}>
          {availableCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseItem,
                { backgroundColor: colors.card },
                selectedCourses.includes(course.id) && { borderColor: colors.primary }
              ]}
              onPress={() => toggleCourseSelection(course.id)}
            >
              <View style={styles.courseInfo}>
                <Text style={[styles.courseCode, { color: colors.primary }]}>
                  {course.code}
                </Text>
                <Text style={[styles.courseName, { color: colors.text }]}>
                  {course.name}
                </Text>
                <Text style={[styles.courseInstructor, { color: colors.textSecondary }]}>
                  {course.instructorName}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedCourses.includes(course.id) && { backgroundColor: colors.primary }
              ]}>
                {selectedCourses.includes(course.id) && (
                  <MaterialCommunityIcons name="check" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  );

  const renderReviewStep = () => (
    <Card elevated style={styles.formCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Review Your Information
      </Text>

      <View style={styles.reviewSection}>
        <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Personal Information</Text>
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewKey, { color: colors.textSecondary }]}>Name:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{`${formData.firstName} ${formData.lastName}`}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewKey, { color: colors.textSecondary }]}>Email:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.email}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewKey, { color: colors.textSecondary }]}>Phone:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.phone}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewKey, { color: colors.textSecondary }]}>Department:</Text>
          <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.department}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Selected Courses ({selectedCourses.length})</Text>
        {selectedCourses.map((courseId) => {
          const course = availableCourses.find(c => c.id === courseId);
          return (
            <View key={courseId} style={styles.reviewItem}>
              <Text style={[styles.reviewKey, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.reviewValue, { color: colors.text }]}>
                {course?.code} - {course?.name}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card elevated style={styles.headerCard}>
          <MaterialCommunityIcons name="account-plus" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Create Student Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Register to start tracking your attendance
          </Text>
        </Card>

        {renderStepIndicator()}

        {currentStep === 'personal' && renderPersonalInfoStep()}
        {currentStep === 'courses' && renderCourseSelectionStep()}
        {currentStep === 'review' && renderReviewStep()}

        <View style={styles.buttonContainer}>
          {currentStep !== 'personal' && (
            <Button
              title="Previous"
              onPress={handlePreviousStep}
              variant="outline"
              style={styles.previousButton}
            />
          )}
          
          {currentStep === 'review' ? (
            <Button
              title={isLoading ? "Creating Account..." : "Create Account"}
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.nextButton}
            />
          ) : (
            <Button
              title="Next"
              onPress={handleNextStep}
              style={styles.nextButton}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: screenWidth > 400 ? 24 : 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  step: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(0,0,0,0.5)',
  },
  activeStep: {
    // Active step styling
  },
  activeStepText: {
    color: '#007AFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: '#007AFF',
  },
  formCard: {
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  courseList: {
    gap: 12,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  courseInstructor: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewKey: {
    fontSize: 14,
    marginRight: 8,
    minWidth: 80,
  },
  reviewValue: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
}); 