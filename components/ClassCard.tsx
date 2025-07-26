import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

const { width: screenWidth } = Dimensions.get('window');

interface ClassCardProps {
  course: {
    id: string;
    name: string;
    code: string;
    instructor?: {
      name: string;
    };
    startTime?: string;
    endTime?: string;
    location?: string;
  };
  isActive?: boolean;
  onPress?: () => void;
}

export default function ClassCard({ course, isActive = false, onPress }: ClassCardProps) {
  const { colors } = useTheme();

  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'TBD';
    return time.substring(0, 5); // Convert "14:30:00" to "14:30"
  };

  const getStatusColor = () => {
    if (isActive) return colors.success;
    return colors.textSecondary;
  };

  const getStatusText = () => {
    if (isActive) return 'Active Now';
    return 'Upcoming';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Card elevated style={[styles.card, { backgroundColor: colors.card }] as any}>
        <View style={styles.header}>
          <View style={styles.courseInfo}>
            <Text style={[styles.courseCode, { color: colors.primary }]}>
              {course.code}
            </Text>
            <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={2}>
              {course.name}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          {course.instructor && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons 
                name="account" 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {course.instructor.name}
              </Text>
            </View>
          )}

          {(course.startTime || course.endTime) && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {formatTime(course.startTime || '')} - {formatTime(course.endTime || '')}
              </Text>
            </View>
          )}

          {course.location && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {course.location}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={onPress}
            >
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseName: {
    fontSize: screenWidth > 400 ? 16 : 14,
    fontWeight: '600',
    lineHeight: screenWidth > 400 ? 22 : 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});