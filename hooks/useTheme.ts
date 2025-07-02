import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, isSystemTheme } = useThemeStore();
  
  // Determine the active theme
  const activeTheme = isSystemTheme ? systemColorScheme : theme;
  
  // Get the colors for the active theme
  const colors = activeTheme === 'dark' ? Colors.dark : Colors.light;
  
  return {
    activeTheme,
    colors,
    isDark: activeTheme === 'dark',
  };
}