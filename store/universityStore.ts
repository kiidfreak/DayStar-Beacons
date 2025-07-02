import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface University {
  id: string;
  name: string;
  location: string;
  logo: string;
}

interface UniversityState {
  university: University | null;
  setUniversity: (university: University) => void;
  clearUniversity: () => void;
}

export const useUniversityStore = create<UniversityState>()(
  persist(
    (set) => ({
      university: null,
      setUniversity: (university) => set({ university }),
      clearUniversity: () => set({ university: null }),
    }),
    {
      name: 'university-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Add error handling for persistence
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('University store rehydration error:', error);
        }
      },
    }
  )
);