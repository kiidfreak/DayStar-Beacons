import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'attendance' | 'technical' | 'account';
}

export default function FAQScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  // FAQ data
  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How does TallyCheck track my attendance?',
      answer: 'TallyCheck uses a combination of Bluetooth Low Energy (BLE) beacons and QR codes to track your attendance. When you\'re in class, the app automatically detects nearby beacons or you can scan a QR code displayed by your instructor.',
      category: 'attendance'
    },
    {
      id: '2',
      question: 'What if I forget to check in for a class?',
      answer: 'If you miss checking in during class, you can contact your instructor to manually mark your attendance. Some courses also allow late check-ins within a specified time window after class ends.',
      category: 'attendance'
    },
    {
      id: '3',
      question: 'How do I enroll in a course?',
      answer: 'Go to the Courses tab and browse available courses. Tap on a course to view details and use the "Enroll" button to join. You\'ll need to be registered for the course in your university system first.',
      category: 'general'
    },
    {
      id: '4',
      question: 'Can I view my attendance history?',
      answer: 'Yes! Navigate to the Attendance History tab to see your detailed attendance records, including overall performance, individual class attendance, and attendance trends over time.',
      category: 'attendance'
    },
    {
      id: '5',
      question: 'What if my device isn\'t working properly?',
      answer: 'First, try restarting the app and your device. If issues persist, go to Settings > Device Binding to re-register your device. For technical support, contact your university\'s IT department.',
      category: 'technical'
    },
    {
      id: '6',
      question: 'How do I change my device?',
      answer: 'Go to your Profile page and tap "Change Device" in the Device Binding section. Follow the instructions to register your new device. Your old device will be automatically unregistered.',
      category: 'account'
    },
    {
      id: '7',
      question: 'Are my attendance records private?',
      answer: 'Yes, your attendance data is private and only visible to you and your course instructors. The app follows strict privacy guidelines and your data is encrypted and securely stored.',
      category: 'general'
    },
    {
      id: '8',
      question: 'What do the different notification types mean?',
      answer: 'Missed notifications alert you when you\'ve missed a class. Upcoming notifications remind you about classes starting soon. Reminder notifications warn you when your attendance is below the required threshold.',
      category: 'general'
    },
    {
      id: '9',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile page and tap the edit button next to your name. You can update your contact information, profile picture, and other personal details from there.',
      category: 'account'
    },
    {
      id: '10',
      question: 'What if I\'m having trouble with Bluetooth?',
      answer: 'Make sure Bluetooth is enabled on your device. If you\'re still having issues, try toggling Bluetooth off and on, or restart your device. The app will guide you through the connection process.',
      category: 'technical'
    },
    {
      id: '11',
      question: 'Can I use TallyCheck on multiple devices?',
      answer: 'For security reasons, you can only use TallyCheck on one device at a time. If you need to switch devices, you\'ll need to unregister your current device first.',
      category: 'account'
    },
    {
      id: '12',
      question: 'How accurate is the attendance tracking?',
      answer: 'TallyCheck is highly accurate when used properly. The combination of BLE beacons and QR codes ensures reliable attendance tracking. However, it\'s important to be within range of the beacon or scan the QR code correctly.',
      category: 'attendance'
    }
  ];

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

  const toggleItem = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attendance':
        return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
      case 'technical':
        return <Ionicons name="settings" size={20} color={colors.primary} />;
      case 'account':
        return <Ionicons name="person" size={20} color={colors.warning} />;
      default:
        return <Ionicons name="help-circle" size={20} color={colors.textSecondary} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attendance':
        return colors.success;
      case 'technical':
        return colors.primary;
      case 'account':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

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
            <Text style={[styles.mainTitle, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Find answers to common questions about TallyCheck
            </Text>
          </View>
        </Animated.View>

        {/* FAQ Items */}
        <Animated.View 
          style={[
            styles.faqContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {faqData.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            
            return (
              <View 
                key={item.id} 
                style={[
                  styles.faqItem, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginBottom: index === faqData.length - 1 ? 0 : 12
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.questionContainer}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionLeft}>
                    <View style={styles.categoryIcon}>
                      {getCategoryIcon(item.category)}
                    </View>
                    <Text style={[styles.question, { color: colors.text }]}>
                      {item.question}
                    </Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: isExpanded ? '180deg' : '0deg'
                      }]
                    }}
                  >
                    <Ionicons 
                      name="chevron-down" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </Animated.View>
                </TouchableOpacity>
                
                {isExpanded && (
                  <Animated.View 
                    style={[
                      styles.answerContainer,
                      {
                        borderTopColor: colors.border,
                      }
                    ]}
                  >
                    <Text style={[styles.answer, { color: colors.textSecondary }]}>
                      {item.answer}
                    </Text>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* Contact Support */}
        <Animated.View 
          style={[
            styles.supportContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.supportHeader}>
              <Ionicons name="mail" size={24} color={colors.primary} />
              <Text style={[styles.supportTitle, { color: colors.text }]}>
                Still Need Help?
              </Text>
            </View>
            <Text style={[styles.supportText, { color: colors.textSecondary }]}>
              Can't find the answer you're looking for? Contact our support team for personalized assistance.
            </Text>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary }]}
              onPress={() => console.log('Contact support pressed')}
            >
              <Text style={[styles.contactButtonText, { color: '#FFFFFF' }]}>
                Contact Support
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
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
  header: {
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  faqContainer: {
    marginBottom: 32,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  questionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    marginRight: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
  },
  answerContainer: {
    borderTopWidth: 1,
    padding: 20,
    paddingTop: 16,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
  },
  supportContainer: {
    marginTop: 16,
  },
  supportCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  supportText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});