import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Attendance Recorded',
    message: 'Your attendance for CS101 has been successfully recorded.',
    timestamp: Date.now() - 3600000, // 1 hour ago
    read: false,
  },
  {
    id: '2',
    title: 'Class Reminder',
    message: 'Your CS201 class starts in 30 minutes.',
    timestamp: Date.now() - 7200000, // 2 hours ago
    read: false,
  },
  {
    id: '3',
    title: 'Attendance Warning',
    message: 'Your attendance in CS301 is below 75%. Please improve your attendance.',
    timestamp: Date.now() - 86400000, // 1 day ago
    read: true,
  },
];

export default function NotificationBell() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} min ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} hr ago`;
    } else {
      return `${Math.floor(diff / 86400000)} day ago`;
    }
  };
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setModalVisible(false);
  };
  
  // Safely create styles for web compatibility
  const bellContainerStyle = StyleSheet.flatten([
    styles.bellContainer, 
    { backgroundColor: colors.card }
  ]);
  
  const badgeStyle = StyleSheet.flatten([
    styles.badge, 
    { backgroundColor: colors.primary }
  ]);
  
  const modalContentStyle = StyleSheet.flatten([
    styles.modalContent, 
    { 
      backgroundColor: colors.background,
      borderColor: colors.border,
    }
  ]);
  
  return (
    <>
      <TouchableOpacity
        style={bellContainerStyle}
        onPress={() => setModalVisible(true)}
      >
        <Feather name="bell" size={24} color="currentColor" />
        {unreadCount > 0 && (
          <View style={badgeStyle}>
            <Text style={styles.badgeText}>
              {unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Notifications
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            
            {notifications.length > 0 ? (
              <>
                <FlatList
                  data={notifications}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    const notificationItemStyle = StyleSheet.flatten([
                      styles.notificationItem,
                      { borderBottomColor: colors.border },
                      !item.read && { backgroundColor: `${colors.primary}10` },
                    ]);
                    
                    return (
                      <TouchableOpacity
                        style={notificationItemStyle}
                        onPress={() => markAsRead(item.id)}
                      >
                        <View style={styles.notificationContent}>
                          <Text style={[styles.notificationTitle, { color: colors.text }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                            {item.message}
                          </Text>
                          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                            {formatTimestamp(item.timestamp)}
                          </Text>
                        </View>
                        {!item.read && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.notificationsList}
                />
                
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <Button
                    title="Mark All as Read"
                    onPress={markAllAsRead}
                    variant="outline"
                    size="small"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <Button
                    title="Clear All"
                    onPress={clearAll}
                    variant="primary"
                    size="small"
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="bell" size={48} color={`${colors.primary}50`} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  You're all caught up!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsList: {
    paddingBottom: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});