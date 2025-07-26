import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/constants/colors';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeColors: typeof colors.light;
  isDark: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        // Update themeColors based on new theme
        const actualTheme = theme === 'system' ? 'light' : theme; // Default to light for system
        set({ 
          themeColors: colors[actualTheme],
          isDark: actualTheme === 'dark'
        });
      },
      themeColors: colors.light,
      isDark: false,
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update themeColors when rehydrating
          const actualTheme = state.theme === 'system' ? 'light' : state.theme;
          state.themeColors = colors[actualTheme];
          state.isDark = actualTheme === 'dark';
        }
      },
    }
  )
);