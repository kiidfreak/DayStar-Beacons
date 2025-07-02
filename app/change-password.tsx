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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChangePassword = () => {
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
    
    // Simulate password change
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success', 
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card elevated style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>
            Change Your Password
          </Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Create a strong password that you don't use for other accounts
          </Text>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Current Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <Feather name="lock" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                {showCurrentPassword ? (
                  <Feather name="eye-off" size={20} color={colors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              New Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <Feather name="lock" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                {showNewPassword ? (
                  <Feather name="eye-off" size={20} color={colors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Confirm New Password
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <Feather name="lock" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <Feather name="eye-off" size={20} color={colors.textSecondary} />
                ) : (
                  <Feather name="eye" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.passwordRequirements}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Password Requirements:
            </Text>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
              <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                At least 8 characters long
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
              <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
                Include at least one uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
              <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
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
              isLoading={isLoading}
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