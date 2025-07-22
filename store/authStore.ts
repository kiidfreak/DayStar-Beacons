import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { DeviceBindingService } from '@/services/deviceBindingService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrated: boolean;
  justLoggedOut: boolean;
  deviceBound: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setJustLoggedOut: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
  registerDevice: (userId: string) => Promise<boolean>;
  verifyDeviceBinding: (userId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hydrated: true, // Always set to true to prevent spinner
      justLoggedOut: false,
      deviceBound: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('Starting login process for:', email);
          
          // Test basic network connectivity first
          console.log('Testing network connectivity...');
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://httpbin.org/get', { 
              method: 'GET',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('Network test result:', response.ok ? 'Success' : 'Failed');
          } catch (networkError) {
            console.log('Network test failed:', networkError);
          }
          
          // Test connection first
          console.log('Testing Supabase connection...');
          try {
            const { data: testData, error: testError } = await supabase.from('users').select('count').limit(1);
            console.log('Connection test result:', testError ? 'Failed' : 'Success');
          } catch (testError) {
            console.log('Connection test failed:', testError);
          }
          
          console.log('Calling Supabase auth.signInWithPassword...');
          
          // Add timeout to prevent hanging
          const authPromise = supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout - please check your internet connection')), 10000)
          );
          
          // Race between auth call and timeout
          const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;

          console.log('Supabase auth call completed');
          console.log('Auth result - data:', !!data, 'error:', !!error);

          if (error) {
            console.error('Supabase auth error:', error);
            throw error;
          }

          console.log('Supabase auth successful, user:', data.user?.id);

          if (data.user) {
            console.log('Creating user object...');
            
            // Try to fetch user profile with timeout
            let userProfile = null;
            try {
              console.log('Fetching user profile...');
              const profilePromise = supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
              
              const profileTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
              );
              
              const { data: profileData, error: profileError } = await Promise.race([
                profilePromise,
                profileTimeout
              ]) as any;
              
              if (profileError) {
                console.log('Profile fetch error (continuing without profile):', profileError);
              } else {
                userProfile = profileData;
                console.log('User profile fetched successfully');
              }
            } catch (profileError) {
              console.log('Profile fetch failed (continuing without profile):', profileError);
            }
            
            // Create user object with profile data if available
            const user: User = {
              id: data.user.id,
              name: userProfile?.full_name || data.user.user_metadata?.full_name || 'Student',
              email: data.user.email || '',
              role: userProfile?.role || 'student',
              firstName: userProfile?.full_name?.split(' ')[0] || data.user.user_metadata?.full_name?.split(' ')[0] || 'Student',
              lastName: userProfile?.full_name?.split(' ').slice(1).join(' ') || data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              approvalStatus: userProfile?.approval_status || 'approved',
              createdAt: data.user.created_at || new Date().toISOString(),
              updatedAt: data.user.updated_at || new Date().toISOString(),
              phone: userProfile?.phone || '',
              department: userProfile?.department || '',
            };

            console.log('Setting auth state with user:', user.name);
            set({ 
              user, 
              token: data.session?.access_token || null, 
              isAuthenticated: true, 
              isLoading: false 
            });

            // Verify device binding after successful login
            try {
              console.log('Verifying device binding...');
              if (DeviceBindingService && typeof DeviceBindingService.verifyDeviceBinding === 'function') {
                const isDeviceBound = await DeviceBindingService.verifyDeviceBinding(user.id);
                
                if (!isDeviceBound) {
                  // Try to register device if not bound
                  console.log('Device not bound, attempting registration...');
                  await DeviceBindingService.registerDevice(user.id);
                  set({ deviceBound: true });
                  console.log('Device registered successfully');
                } else {
                  set({ deviceBound: true });
                  console.log('Device binding verified');
                }
              } else {
                console.log('DeviceBindingService not available, skipping device binding');
                set({ deviceBound: false });
              }
            } catch (deviceError) {
              console.error('Device binding error:', deviceError);
              // Don't fail login for device binding issues, but log them
              set({ deviceBound: false });
            }

            console.log('Login process completed successfully');
          } else {
            throw new Error('No user data received');
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            error: error instanceof Error ? error.message : "An unknown error occurred", 
            isLoading: false 
          });
          // Re-throw the error so the login screen can catch it
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Sign out from Supabase
          const { error: supabaseError } = await supabase.auth.signOut();
          
          if (supabaseError) {
            console.error('Supabase signOut error:', supabaseError);
            throw supabaseError;
          }
          
          // Reset auth state immediately
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null,
            justLoggedOut: true,
            isLoading: false,
          });
          
        } catch (error) {
          console.error('Error during logout:', error);
          
          // Still reset auth state even if there's an error
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null,
            justLoggedOut: true,
            isLoading: false,
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      setJustLoggedOut: (value: boolean) => set({ justLoggedOut: value }),
      
      // Force set hydrated to true to prevent spinner issues
      setHydrated: (value: boolean) => set({ hydrated: value }),
      
      registerDevice: async (userId: string) => {
        try {
          const success = await DeviceBindingService.registerDevice(userId);
          if (success) {
            set({ deviceBound: true });
          }
          return success;
        } catch (error) {
          console.error('Error registering device:', error);
          throw error;
        }
      },
      
      verifyDeviceBinding: async (userId: string) => {
        try {
          const isVerified = await DeviceBindingService.verifyDeviceBinding(userId);
          set({ deviceBound: isVerified });
          return isVerified;
        } catch (error) {
          console.error('Error verifying device binding:', error);
          set({ deviceBound: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth store rehydration error:', error);
        }
        // Set hydrated to true immediately after rehydration
        setTimeout(() => {
          useAuthStore.setState({ hydrated: true });
        }, 0);
      },
    }
  )
);

// Restore auth state listener to handle automatic login
setTimeout(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    
    if (event === 'SIGNED_IN' && session?.user) {
      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // Create user object compatible with the app
      const user: User = {
        id: session.user.id,
        name: userProfile?.full_name || session.user.user_metadata?.full_name || 'Student',
        email: session.user.email || '',
        role: userProfile?.role || 'student',
        firstName: userProfile?.full_name?.split(' ')[0] || 'Student',
        lastName: userProfile?.full_name?.split(' ').slice(1).join(' ') || '',
        approvalStatus: 'approved',
        createdAt: session.user.created_at || new Date().toISOString(),
        updatedAt: session.user.updated_at || new Date().toISOString(),
        phone: userProfile?.phone || '',
        department: userProfile?.department || '',
      };

      useAuthStore.setState({ 
        user, 
        token: session.access_token, 
        isAuthenticated: true,
        error: null,
      });
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        error: null,
      });
    }
  });
}, 1000); // Delay auth state listener by 1 second to ensure app is ready