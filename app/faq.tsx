import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FAQScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  console.log('FAQScreen: Rendering with user:', user?.id);

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

  const FAQData = {
    all: [
      { id: 1, question: "How does attendance tracking work?", answer: "Attendance is tracked automatically when you're near the classroom beacon or by scanning QR codes.", category: "attendance" },
      { id: 2, question: "What if I forget my phone during class?", answer: "Contact your lecturer to manually mark your attendance.", category: "device" },
      { id: 3, question: "Can I use multiple devices?", answer: "No, only one device can be registered at a time for security.", category: "device" },
      { id: 4, question: "How do I change my registered device?", answer: "Go to Settings > Device Management to change your device.", category: "device" },
      { id: 5, question: "Why is my attendance not being recorded?", answer: "Check your device registration and ensure you're within range of the classroom beacon.", category: "troubleshooting" },
    ],
    attendance: [
      { id: 1, question: "How does attendance tracking work?", answer: "Attendance is tracked automatically when you're near the classroom beacon or by scanning QR codes.", category: "attendance" },
    ],
    device: [
      { id: 2, question: "What if I forget my phone during class?", answer: "Contact your lecturer to manually mark your attendance.", category: "device" },
      { id: 3, question: "Can I use multiple devices?", answer: "No, only one device can be registered at a time for security.", category: "device" },
      { id: 4, question: "How do I change my registered device?", answer: "Go to Settings > Device Management to change your device.", category: "device" },
    ],
    troubleshooting: [
      { id: 5, question: "Why is my attendance not being recorded?", answer: "Check your device registration and ensure you're within range of the classroom beacon.", category: "troubleshooting" },
    ],
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'device', label: 'Device' },
    { key: 'troubleshooting', label: 'Troubleshooting' },
  ];

  const currentFAQs = FAQData[activeCategory as keyof typeof FAQData] || [];

  const toggleItem = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
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
          <View style={styles.titleHeader}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.mainTitle, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find answers to common questions
          </Text>
        </Animated.View>

        {/* Category Tabs */}
        <Animated.View 
          style={[
            styles.tabsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.key}
              style={[
                styles.tab, 
                activeCategory === category.key && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveCategory(category.key)}
            >
              <Text style={[
                styles.tabText, 
                { color: activeCategory === category.key ? '#FFFFFF' : colors.text }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* FAQ List */}
        <Animated.View 
          style={[
            styles.faqContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {currentFAQs.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[styles.faqItem, { backgroundColor: colors.card }]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {item.question}
                </Text>
                <Ionicons 
                  name={expandedItem === item.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>
              {expandedItem === item.id && (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Help & Support Section */}
        <Animated.View 
          style={[
            styles.helpSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.helpCard, { backgroundColor: colors.card }]}>
            <View style={styles.helpHeader}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
              <Text style={[styles.helpTitle, { color: colors.text }]}>
                Help & Support
              </Text>
            </View>
            <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>
              Get additional help and support
            </Text>
            
            <TouchableOpacity style={styles.helpAction}>
              <Ionicons name="mail-outline" size={20} color={colors.text} />
              <Text style={[styles.helpActionText, { color: colors.text }]}>
                Contact Support (support@tallycheck.com)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpAction}>
              <Ionicons name="document-text-outline" size={20} color={colors.text} />
              <Text style={[styles.helpActionText, { color: colors.text }]}>
                User Guide & Documentation
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpAction}>
              <Ionicons name="shield-outline" size={20} color={colors.text} />
              <Text style={[styles.helpActionText, { color: colors.text }]}>
                Privacy Policy & Terms
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View 
          style={[
            styles.appInfoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.appInfoCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.appInfoText, { color: colors.textSecondary, textAlign: 'center' }]}>
              TallyCheck v1.0.0
            </Text>
            <Text style={[styles.appInfoText, { color: colors.textSecondary, textAlign: 'center' }]}>
              Student Attendance Tracking System
            </Text>
            <Text style={[styles.appInfoText, { color: colors.textSecondary, textAlign: 'center' }]}>
              © 2024 TallyCheck. All rights reserved.
            </Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Daystar University
          </Text>
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
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  faqContainer: {
    marginBottom: 24,
    gap: 12,
  },
  faqItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  helpSection: {
    marginBottom: 24,
  },
  helpCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  helpSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  helpAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  helpActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  appInfoSection: {
    marginBottom: 24,
  },
  appInfoCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  appInfoText: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});