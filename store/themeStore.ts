import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: ColorSchemeName;
  isSystemTheme: boolean;
  setTheme: (theme: ColorSchemeName) => void;
  setIsSystemTheme: (isSystemTheme: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      isSystemTheme: true,
      setTheme: (theme) => set({ theme }),
      setIsSystemTheme: (isSystemTheme) => set({ isSystemTheme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Add error handling for persistence
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Theme store rehydration error:', error);
        }
      },
    }
  )
);