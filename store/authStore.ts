import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Mock login function - would be replaced with actual API call
const mockLogin = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === "student@uni.edu" && password === "password") {
    return {
      user: {
        id: "2481afa5-833d-42de-8738-47c079753140",
        name: "John Doe",
        email: "student@uni.edu",
        studentId: "S12345",
        deviceId: "device-123",
        role: "student",
        firstName: "John",
        lastName: "Doe",
        approvalStatus: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: "mock-jwt-token"
    };
  }
  // Add admin login
  if (email === "admin@uni.edu" && password === "adminpass") {
    return {
      user: {
        id: "869422ee-0b93-446a-b09c-3d062d44698b",
        name: "Admin User",
        email: "admin@uni.edu",
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        approvalStatus: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: "mock-admin-token"
    };
  }
  
  throw new Error("Invalid credentials");
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hydrated: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await mockLogin(email, password);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "An unknown error occurred", 
            isLoading: false 
          });
        }
      },
      
      logout: async () => {
        try {
          // Clear all persisted storage with timeout
          const clearPromise = AsyncStorage.multiRemove([
            'auth-storage',
            'university-storage',
            'theme-storage'
          ]);
          
          // Add timeout to prevent hanging
          await Promise.race([
            clearPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Storage clear timeout')), 2000)
            )
          ]);
          
          // Reset auth state
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null
          });
          
        } catch (error) {
          console.error('Error during logout:', error);
          // Still reset auth state even if storage clear fails
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        set({ hydrated: true });
        if (error) {
          console.error('Auth store rehydration error:', error);
        }
      },
    }
  )
);

// Fallback: set hydrated to true after mount if it hasn't been set (for web and native)
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  setTimeout(() => {
    const { hydrated } = useAuthStore.getState();
    console.log('Hydration fallback fired, hydrated:', hydrated);
    if (!hydrated) {
      useAuthStore.setState({ hydrated: true });
      console.log('Hydration fallback set hydrated to true');
    }
  }, 100);
}