import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAttendanceStore } from '@/store/attendanceStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QRSecurityUtils } from '@/utils/qrSecurity';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '@/store/authStore';
import { CourseService } from '@/services/courseService';

// This component would typically be used by instructors
// For demo purposes, we'll show how secure QR codes are generated
export default function QRGenerator() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { courses } = useAttendanceStore();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('QRGenerator: rendered, user =', user);

  // Fetch all courses for admin/instructor
  React.useEffect(() => {
    const fetchAdminCourses = async () => {
      console.log('QRGenerator: fetchAdminCourses called, user =', user, 'role =', user?.role, 'schoolId =', user?.schoolId);
      if (!user) return;
      if (user.role !== 'student') {
        setLoading(true);
        try {
          console.log('QRGenerator: fetching all courses for admin/instructor', user.schoolId, user.id);
          const result = await CourseService.getAvailableCourses(user.schoolId || '', user.id);
          console.log('QRGenerator: result from getAvailableCourses', result);
          setAdminCourses(result);
        } catch (e) {
          setAdminCourses([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAdminCourses();
  }, [user]);

  // Use correct course list
  const courseList = user && user.role !== 'student' ? adminCourses : courses;

  const generateQRCode = () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course first');
      return;
    }
    // Find selected course to get instructorId
    const courseObj = courseList.find((c: any) => c.id === selectedCourse);
    const instructorId = courseObj?.instructorId || user?.id || 'instructor-1';
    const qrData = QRSecurityUtils.generateMockQRCode(selectedCourse, instructorId);
    const qrString = JSON.stringify(qrData);
    console.log('QR STRING:', qrString);
    setGeneratedQR(qrString);
    Alert.alert(
      'QR Code Generated',
      'Secure QR code has been generated with:\n• Time-based expiration\n• Location validation\n• Anti-tampering signature',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <Card elevated style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="qrcode" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Secure QR Generator
        </Text>
      </View>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Generate secure attendance QR codes with built-in security features
      </Text>
      
      <View style={styles.securityFeatures}>
        <View style={styles.feature}>
          <MaterialCommunityIcons name="clock" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            5-minute expiration
          </Text>
        </View>
        <View style={styles.feature}>
          <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Location verification
          </Text>
        </View>
        <View style={styles.feature}>
          <MaterialCommunityIcons name="shield" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            Cryptographic signature
          </Text>
        </View>
      </View>
      
      <View style={styles.courseSelection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Course:</Text>
        {loading ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Loading courses...</Text>
        ) : courseList.length === 0 ? (
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No courses found.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {courseList.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseOption,
                  {
                    backgroundColor: selectedCourse === course.id ? `${colors.primary}20` : colors.card,
                    borderColor: selectedCourse === course.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setSelectedCourse(course.id)}
              >
                <Text style={[
                  styles.courseText,
                  { color: selectedCourse === course.id ? colors.primary : colors.text }
                ]}>
                  {course.code} - {course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      
      <Button
        title="Generate Secure QR Code"
        onPress={generateQRCode}
        variant="primary"
        size="medium"
        disabled={!selectedCourse}
      />
      
      {generatedQR && (
        <View style={[styles.qrPreview, { backgroundColor: `${colors.success}10` }]}>
          <Text style={[styles.qrLabel, { color: colors.success }]}>
            QR Code Generated Successfully
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <QRCode value={generatedQR} size={160} />
          </View>
          <Text style={[styles.qrData, { color: colors.textSecondary }]}>
            Preview: {generatedQR.substring(0, 100)}...
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  securityFeatures: {
    marginBottom: 20,
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
  },
  courseSelection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  courseOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  courseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrPreview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  qrData: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});