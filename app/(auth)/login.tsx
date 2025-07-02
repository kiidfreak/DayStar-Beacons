import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useUniversityStore } from '@/store/universityStore';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import globalStyles from '@/styles/global';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const { university, clearUniversity } = useUniversityStore();
  const { colors } = useTheme();
  const [email, setEmail] = useState('student@uni.edu');
  const [password, setPassword] = useState('password');
  
  // Navigate to home when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);
  
  // If no university selected, redirect to university selection
  useEffect(() => {
    if (!university) {
      router.replace('/(auth)/select-university');
    }
  }, [university, router]);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in the store
    }
  };
  
  const handleBackToUniversitySelection = () => {
    clearUniversity();
    router.replace('/(auth)/select-university');
  };
  
  // Clear any errors when component unmounts
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, []);
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToUniversitySelection}
            >
              <Feather name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Logo size="large" showTagline={true} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to {university?.name || 'your university'}
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15` }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}
            
            <View style={[styles.demoCredentialsContainer, { 
              backgroundColor: `${colors.primary}10`,
              borderColor: `${colors.primary}30`
            }]}>
              <Text style={[styles.demoCredentialsTitle, { color: colors.primary }]}>
                Demo Credentials
              </Text>
              <Text style={[styles.demoCredentialsText, { color: colors.primary }]}>
                Email: student@uni.edu
              </Text>
              <Text style={[styles.demoCredentialsText, { color: colors.primary }]}>
                Password: password
              </Text>
            </View>
            
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <Feather name="mail" size={24} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email or Student ID"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}>
              <Feather name="lock" size={24} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            <Button
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              variant="primary"
              size="large"
              style={styles.loginButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity>
              <Text style={[styles.signUpText, { color: colors.primary }]}>
                Contact Administrator
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    // Add extra top padding to prevent content from being covered
    paddingTop: Platform.select({
      ios: 40,
      android: 60,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 10,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  demoCredentialsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  demoCredentialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoCredentialsText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: Platform.select({
      ios: 20,
      android: 40,
    }),
  },
  footerText: {
    fontSize: 14,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '600',
  },
});