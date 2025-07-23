import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

// Define types for FAQ data structure
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

type FAQData = {
  [key: string]: FAQSection;
};

// FAQ data structure
const faqData: FAQData = {
  general: {
    title: "General Questions",
    items: [
      {
        question: "What is TCheck?",
        answer: "TCheck is an automated attendance tracking system that uses beacon technology to record student presence in classes. It offers features like QR code check-in, attendance history, and real-time tracking."
      },
      {
        question: "How does the attendance system work?",
        answer: "The system uses Bluetooth beacons placed in classrooms to automatically detect and record your presence. When you enter a classroom, the app connects to the beacon and marks your attendance. You can also use QR codes as a backup check-in method."
      },
      {
        question: "What should I do if I am having trouble with the app?",
        answer: "First, ensure your Bluetooth is enabled and you are within range of the classroom. If issues persist, try restarting the app or your device. You can also contact technical support through your student portal."
      }
    ]
  },
  attendance: {
    title: "Attendance Tracking",
    items: [
      {
        question: "What happens if the beacon does not detect me?",
        answer: "If the beacon fails to detect you, you can use the QR code check-in feature as a backup. Each classroom has a unique QR code that you can scan to mark your attendance."
      },
      {
        question: "How long do I need to stay in class to be marked present?",
        answer: "You need to be present for at least 75% of the class duration to be marked as fully present. Arriving late or leaving early may result in partial attendance or being marked as late."
      },
      {
        question: "Can I check my attendance history?",
        answer: "Yes, you can view your complete attendance history in the History section. It shows all your attendance records, including dates, times, and attendance status for each class."
      }
    ]
  },
  technical: {
    title: "Technical Support",
    items: [
      {
        question: "What should I do if I change my device?",
        answer: "If you need to change your device, go to Settings > Device Change and submit a request. An administrator will review and approve your request within 1-2 business days."
      },
      {
        question: "Why does the app need Bluetooth permission?",
        answer: "The app requires Bluetooth to connect with classroom beacons for automated attendance tracking. Without Bluetooth permission, the automatic check-in feature will not work."
      },
      {
        question: "Does the app work without internet?",
        answer: "The app requires an internet connection to sync attendance records with the server. However, it can temporarily store attendance data offline and sync when connection is restored."
      }
    ]
  },
  account: {
    title: "Account Management",
    items: [
      {
        question: "How do I change my password?",
        answer: "Go to Settings > Change Password. You will need to enter your current password and choose a new one that meets the security requirements."
      },
      {
        question: "What happens if I forget my password?",
        answer: "Use the Forgot Password option on the login screen. A password reset link will be sent to your registered email address."
      },
      {
        question: "How can I update my profile information?",
        answer: "Visit your profile page by tapping on your avatar in Settings. You can update certain information there. For major changes, contact your administrator."
      }
    ]
  }
};

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isExpanded, onToggle }: FAQItemProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.questionContainer}>
        <Text style={[styles.question, { color: colors.text }]}>
          {question}
        </Text>
        {isExpanded ? (
          <Feather name="chevron-up" size={20} color={colors.primary} />
        ) : (
          <Feather name="chevron-down" size={20} color={colors.primary} />
        )}
      </View>
      
      {isExpanded && (
        <Text style={[styles.answer, { color: colors.textSecondary }]}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function FAQScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const filterFAQs = () => {
    const query = searchQuery.toLowerCase();
    if (!query) return faqData;
    
    const filtered: FAQData = {};
    
    Object.entries(faqData).forEach(([key, section]) => {
      const filteredItems = section.items.filter(
        item => 
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
      
      if (filteredItems.length > 0) {
        filtered[key] = {
          ...section,
          items: filteredItems
        };
      }
    });
    
    return filtered;
  };
  
  const filteredData = filterFAQs();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search FAQs..."
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
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(filteredData).map(([key, section]) => (
          <View key={key} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            
            <Card elevated>
              {section.items.map((item, index) => (
                <FAQItem
                  key={`${key}-${index}`}
                  question={item.question}
                  answer={item.answer}
                  isExpanded={expandedItems[`${key}-${index}`]}
                  onToggle={() => toggleItem(`${key}-${index}`)}
                />
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  faqItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 16,
  },
  answer: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
});