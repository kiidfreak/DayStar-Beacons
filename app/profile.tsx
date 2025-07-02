import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Handle profile image selection
  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar 
              name={user?.name || 'Student'} 
              size="large"
              imageUrl={profileImage || undefined}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleSelectImage}
            >
              <Feather name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.name || 'Student Name'}
          </Text>
          <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
            Student
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </Text>
          
          <Card elevated style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Full Name
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.name || 'Student Name'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editIcon}>
                <Feather name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Email Address
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.email || 'student@uni.edu'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editIcon}>
                <Feather name="edit" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="credit-card" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Student ID
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.studentId || 'S12345'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="smartphone" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Device ID
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.deviceId || 'device-123'}
                </Text>
              </View>
            </View>
          </Card>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Actions
          </Text>
          
          <Button
            title="Change Password"
            onPress={() => Alert.alert('Feature', 'This feature is not available in the demo')}
            variant="outline"
            size="medium"
            style={styles.actionButton}
          />
          
          <Button
            title="Request Device Change"
            onPress={() => Alert.alert('Feature', 'This feature is not available in the demo')}
            variant="outline"
            size="medium"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editIcon: {
    padding: 8,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  actionButton: {
    marginBottom: 12,
  },
});