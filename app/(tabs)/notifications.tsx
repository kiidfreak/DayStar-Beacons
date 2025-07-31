import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'missed' | 'upcoming' | 'reminder' | 'schedule' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  course?: {
    name: string;
    code: string;
  };
  timestamp: string;
  read: boolean;
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  formatTime: (timestamp: string) => string;
  colors: any;
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [selectedTab, setSelectedTab] = useState<'all' | 'missed' | 'upcoming' | 'unread'>('all');

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

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'missed',
      priority: 'high',
      title: 'Missed Class',
      message: 'You missed Database Systems class today at 2:00 PM',
      course: { name: 'Database Systems', code: 'CS 301' },
      timestamp: '2024-01-15T14:00:00Z',
      read: false,
    },
    {
      id: '2',
      type: 'upcoming',
      priority: 'medium',
      title: 'Class Starting Soon',
      message: 'Data Structures class starts in 30 minutes',
      course: { name: 'Data Structures & Algorithms', code: 'CS 201' },
      timestamp: '2024-01-15T13:30:00Z',
      read: false,
    },
    {
      id: '3',
      type: 'reminder',
      priority: 'high',
      title: 'Attendance Reminder',
      message: 'Your attendance in Software Engineering is below 75%',
      course: { name: 'Software Engineering', code: 'CS 401' },
      timestamp: '2024-01-15T12:00:00Z',
      read: true,
    },
    {
      id: '4',
      type: 'schedule',
      priority: 'low',
      title: "Tomorrow's Schedule",
      message: 'You have 3 classes scheduled for tomorrow',
      timestamp: '2024-01-15T10:00:00Z',
      read: true,
    },
    {
      id: '5',
      type: 'system',
      priority: 'low',
      title: 'System Update',
      message: 'TallyCheck has been updated with new features',
      timestamp: '2024-01-14T16:00:00Z',
      read: true,
    },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  // Filter notifications based on selected tab
  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'missed':
        return mockNotifications.filter(n => n.type === 'missed');
      case 'upcoming':
        return mockNotifications.filter(n => n.type === 'upcoming');
      case 'unread':
        return mockNotifications.filter(n => !n.read);
      default:
        return mockNotifications;
    }
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

  const markAllAsRead = () => {
    console.log('Mark all as read pressed');
    // Implement mark all as read functionality
  };

  const markAsRead = (id: string) => {
    console.log('Mark as read:', id);
    // Implement mark as read functionality
  };

  const deleteNotification = (id: string) => {
    console.log('Delete notification:', id);
    // Implement delete notification functionality
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'missed':
        return <Ionicons name="warning" size={20} color={colors.error} />;
      case 'upcoming':
        return <Ionicons name="time" size={20} color={colors.primary} />;
      case 'reminder':
        return <Ionicons name="notifications" size={20} color={colors.warning} />;
      case 'schedule':
        return <Ionicons name="calendar" size={20} color={colors.primary} />;
      case 'system':
        return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
      default:
        return <Ionicons name="notifications" size={20} color={colors.textSecondary} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.border;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
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
              Notifications
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {unreadCount} unread notifications
            </Text>
          </View>
        </Animated.View>

        {/* Header Actions */}
        <Animated.View 
          style={[
            styles.headerActions,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.badge, { borderColor: colors.border }]}
          >
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {unreadCount} Unread
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.markAllButton, { borderColor: colors.border }]}
            onPress={markAllAsRead}
          >
            <Feather name="check-circle" size={16} color={colors.textSecondary} />
            <Text style={[styles.markAllText, { color: colors.textSecondary }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Navigation */}
        <Animated.View 
          style={[
            styles.tabContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.tabList}>
            {(['all', 'missed', 'upcoming', 'unread'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabTrigger,
                  selectedTab === tab && { backgroundColor: colors.border }
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  { color: selectedTab === tab ? colors.text : colors.textSecondary }
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Tab Content */}
        <Animated.View 
          style={[
            styles.tabContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <NotificationList
            notifications={filterNotifications(selectedTab)}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getIcon}
            getPriorityColor={getPriorityColor}
            formatTime={formatTime}
            colors={colors}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  getIcon,
  getPriorityColor,
  formatTime,
  colors
}) => {
  if (notifications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Notifications
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          You're all caught up! New notifications will appear here when you receive them.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.notificationList}>
      {notifications.map((notification) => (
        <View 
          key={notification.id} 
          style={[
            styles.notificationCard, 
            { 
              backgroundColor: !notification.read ? `${colors.primary}10` : colors.card,
              borderLeftColor: getPriorityColor(notification.priority),
            }
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.notificationHeader}>
              <View style={styles.iconContainer}>
                {getIcon(notification.type)}
              </View>
              
              <View style={styles.notificationInfo}>
                <View style={styles.notificationTitleRow}>
                  <View style={styles.notificationText}>
                    <Text style={[
                      styles.notificationTitle, 
                      { color: colors.text },
                      !notification.read && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                      {notification.message}
                    </Text>
                    {notification.course && (
                      <Text style={[styles.courseInfo, { color: colors.primary }]}>
                        {notification.course.name} ({notification.course.code})
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.actionButtons}>
                    {!notification.read && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => onMarkAsRead(notification.id)}
                      >
                        <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onDelete(notification.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.notificationFooter}>
                  <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                    {formatTime(notification.timestamp)}
                  </Text>
                  {!notification.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

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
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 32 : 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    marginBottom: 24,
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  notificationList: {
    gap: 12,
  },
  notificationCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  courseInfo: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
}); 