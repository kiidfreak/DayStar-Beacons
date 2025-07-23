import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { themeColors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  
  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }
    
    if (!user?.email) {
      Alert.alert('Error', 'User email not found');
      return;
    }
    
    setIsLoading(true);
    
    // Re-authenticate user with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setIsLoading(false);
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    if (updateError) {
      Alert.alert('Error', updateError.message || 'Failed to change password');
      return;
    }
    // Clear input fields and show success dialog, then navigate to login
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert(
      'Success',
      'Your password has been changed successfully',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card elevated style={styles.card}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Change Your Password
          </Text>
          
          <Text style={[styles.description, { color: themeColors.textSecondary }]}>
            Create a strong password that you don't use for other accounts
          </Text>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>
              Current Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: themeColors.card,
              borderColor: themeColors.border
            }]}>
              <Feather name="lock" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter current password"
                placeholderTextColor={themeColors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                {showCurrentPassword ? (
                  <Feather name="eye-off" size={20} color={themeColors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={themeColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>
              New Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: themeColors.card,
              borderColor: themeColors.border
            }]}>
              <Feather name="lock" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={themeColors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                {showNewPassword ? (
                  <Feather name="eye-off" size={20} color={themeColors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={themeColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>
              Confirm New Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: themeColors.card,
              borderColor: themeColors.border
            }]}>
              <Feather name="lock" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={themeColors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <Feather name="eye-off" size={20} color={themeColors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={themeColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.passwordRequirements}>
            <Text style={[styles.requirementsTitle, { color: themeColors.text }]}>
              Password Requirements:
            </Text>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.requirementText, { color: themeColors.textSecondary }]}>
                At least 8 characters long
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.requirementText, { color: themeColors.textSecondary }]}>
                Include at least one uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.requirementText, { color: themeColors.textSecondary }]}>
                Include at least one number
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Change Password"
              onPress={handleChangePassword}
              variant="primary"
              size="large"
              loading={isLoading}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
});