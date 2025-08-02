import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

const { width: screenWidth } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  session_id?: string;
  course_id?: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }
      
      console.log('Notification permissions granted');
    };

    requestPermissions();
  }, []);

  // Set up notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      
      // Handle notification tap based on type
      if (data.type === 'upcoming' || data.type === 'missed') {
        // Navigate to the main dashboard to show the relevant session
        router.push('/(tabs)');
      } else if (data.type === 'schedule') {
        // Navigate to courses page to see tomorrow's schedule
        router.push('/(tabs)/courses');
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Function to send push notification
  const sendPushNotification = async (notification: Notification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            type: notification.type,
            sessionId: notification.session_id,
            courseId: notification.course_id,
          },
        },
        trigger: null, // Send immediately
      });
      console.log('Push notification sent:', notification.title);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

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

  // Fetch notifications based on course sessions
  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user's enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_course_enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        throw enrollmentsError;
      }

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      
      if (enrolledCourseIds.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get today's date and time
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      // Fetch class sessions for enrolled courses
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses(
            id,
            name,
            code
          )
        `)
        .in('course_id', enrolledCourseIds)
        .gte('session_date', today)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      // Generate notifications based on sessions
      const generatedNotifications: Notification[] = [];
      
      sessions?.forEach((session: any) => {
        const sessionDate = new Date(session.session_date);
        const sessionTime = session.start_time;
        const sessionDateTime = new Date(`${session.session_date}T${sessionTime}`);
        const timeDiff = sessionDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Check if session is today
        const isToday = session.session_date === today;
        
        if (isToday) {
          // Upcoming session (within 30 minutes)
          if (hoursDiff > 0 && hoursDiff <= 0.5) {
            const notification: Notification = {
              id: `upcoming-${session.id}`,
              type: 'upcoming',
              priority: 'high',
              title: 'Class Starting Soon',
              message: `${session.course.name} starts in ${Math.round(hoursDiff * 60)} minutes`,
              course: {
                name: session.course.name,
                code: session.course.code
              },
              timestamp: new Date().toISOString(),
              read: false,
              session_id: session.id,
              course_id: session.course.id
            };
            generatedNotifications.push(notification);
            
            // Send push notification for upcoming sessions
            sendPushNotification(notification);
          }
          
          // Missed session (past start time)
          if (hoursDiff < 0) {
            const notification: Notification = {
              id: `missed-${session.id}`,
              type: 'missed',
              priority: 'high',
              title: 'Missed Class',
              message: `You missed ${session.course.name} class today at ${sessionTime}`,
              course: {
                name: session.course.name,
                code: session.course.code
              },
              timestamp: new Date().toISOString(),
              read: false,
              session_id: session.id,
              course_id: session.course.id
            };
            generatedNotifications.push(notification);
            
            // Send push notification for missed sessions
            sendPushNotification(notification);
          }
        } else {
          // Future sessions (tomorrow and beyond)
          const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Tomorrow's schedule
            const notification: Notification = {
              id: `schedule-${session.id}`,
              type: 'schedule',
              priority: 'medium',
              title: "Tomorrow's Schedule",
              message: `${session.course.name} at ${sessionTime}`,
              course: {
                name: session.course.name,
                code: session.course.code
              },
              timestamp: new Date().toISOString(),
              read: false,
              session_id: session.id,
              course_id: session.course.id
            };
            generatedNotifications.push(notification);
            
            // Send push notification for tomorrow's schedule
            sendPushNotification(notification);
          }
        }
      });

      // Add system notifications (only send once per app session)
      const systemNotification: Notification = {
        id: 'system-1',
        type: 'system',
        priority: 'low',
        title: 'Welcome to TallyCheck',
        message: 'Your attendance tracking is now active. Stay on top of your classes!',
        timestamp: new Date().toISOString(),
        read: false
      };
      generatedNotifications.push(systemNotification);
      
      // Send system notification only if it's the first time
      const hasSystemNotification = notifications.some(n => n.id === 'system-1');
      if (!hasSystemNotification) {
        sendPushNotification(systemNotification);
      }

      setNotifications(generatedNotifications);
      console.log('Notifications: Generated', generatedNotifications.length, 'notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter notifications based on selected tab
  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'missed':
        return notifications.filter(n => n.type === 'missed');
      case 'upcoming':
        return notifications.filter(n => n.type === 'upcoming');
      case 'unread':
        return notifications.filter(n => !n.read);
      default:
        return notifications;
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
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Alert.alert('Success', 'All notifications marked as read');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          }
        }
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            // Also clear device notifications
            Notifications.dismissAllNotificationsAsync();
          }
        }
      ]
    );
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshNotifications}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.markAllButton, { borderColor: colors.border }]}
              onPress={markAllAsRead}
            >
              <Feather name="check-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.markAllText, { color: colors.textSecondary }]}>
                Mark All Read
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.clearAllButton, { borderColor: colors.error }]}
              onPress={clearAllNotifications}
            >
              <Feather name="trash-2" size={16} color={colors.error} />
              <Text style={[styles.clearAllText, { color: colors.error }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading notifications...
              </Text>
            </View>
          ) : (
            <NotificationList
              notifications={filterNotifications(selectedTab)}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              getIcon={getIcon}
              getPriorityColor={getPriorityColor}
              formatTime={formatTime}
              colors={colors}
            />
          )}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  clearAllText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 