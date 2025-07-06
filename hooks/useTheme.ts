import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import colors from '@/constants/colors';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme as 'light' | 'dark' | 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeAndSave = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine the actual theme to use
  const getActualTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return systemColorScheme || 'light';
    }
    return theme;
  };

  const actualTheme = getActualTheme();
  const themeColors = colors[actualTheme];

  return {
    theme,
    setTheme: setThemeAndSave,
    actualTheme,
    themeColors,
    isLoading,
    systemColorScheme,
  };
}