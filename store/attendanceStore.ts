import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord, Course, BeaconStatus, CheckInPrompt, DayOfWeek } from '@/types';
import { CourseService } from '@/services/courseService';
import { AttendanceService } from '@/services/attendanceService';

interface AttendanceState {
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  currentBeaconStatus: BeaconStatus;
  currentCourse: Course | null;
  checkInPrompt: CheckInPrompt | null;
  isLoadingCourses: boolean;
  isLoadingAttendance: boolean;
  coursesError: string | null;
  attendanceError: string | null;
  bannerMessage: string | null;
  
  // Actions
  setBeaconStatus: (status: BeaconStatus) => void;
  setCurrentCourse: (course: Course | null) => void;
  logAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  setCheckInPrompt: (prompt: CheckInPrompt | null) => void;
  respondToCheckInPrompt: (confirmed: boolean) => void;
  getTodayCourses: () => Course[];
  getCourseAttendance: (courseId: string) => AttendanceRecord[];
  fetchCourses: (studentId: string) => Promise<void>;
  fetchAttendanceRecords: (studentId: string) => Promise<void>;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  fetchAllAttendanceRecords: () => Promise<void>;
  setBannerMessage: (msg: string | null) => void;
  clearBannerMessage: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      courses: [],
      attendanceRecords: [],
      currentBeaconStatus: 'scanning',
      currentCourse: null,
      checkInPrompt: null,
      isLoadingCourses: false,
      isLoadingAttendance: false,
      coursesError: null,
      attendanceError: null,
      bannerMessage: null,
      
      setBeaconStatus: (status) => set({ currentBeaconStatus: status }),
      
      setCurrentCourse: (course) => set({ currentCourse: course }),
      
      logAttendance: (record) => {
        const newRecord: AttendanceRecord = {
          ...record,
          id: `att-${Date.now()}`
        };
        
        set((state) => ({
          attendanceRecords: [newRecord, ...state.attendanceRecords]
        }));
      },
      
      setCheckInPrompt: (prompt) => set({ checkInPrompt: prompt }),
      
      respondToCheckInPrompt: (confirmed) => {
        if (confirmed && get().checkInPrompt) {
          // In a real app, this would send confirmation to the server
          console.log("Confirmed presence for prompt:", get().checkInPrompt);
        }
        
        set({ checkInPrompt: null });
      },
      
      getTodayCourses: () => {
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
        // console.log('DEBUG getTodayCourses: today is', dayOfWeek, 'courses:', get().courses);
        return get().courses.filter(course => 
          !course.days || course.days.includes(dayOfWeek)
        ).sort((a, b) => {
          // Sort by start time
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return 0;
        });
      },
      
      getCourseAttendance: (courseId) => {
        return get().attendanceRecords
          .filter(record => record.courseCode === courseId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      fetchCourses: async (studentId) => {
        set({ isLoadingCourses: true, coursesError: null });
        try {
          const courses = await CourseService.getStudentCourses(studentId);
          console.log('DEBUG fetchCourses (store): fetched courses =', courses);
          set({ courses, isLoadingCourses: false });
        } catch (error: any) {
          console.error('DEBUG fetchCourses (store): error =', error);
          set({ coursesError: error.message || 'Failed to fetch courses', isLoadingCourses: false });
        }
      },
      
      fetchAttendanceRecords: async (studentId) => {
        set({ isLoadingAttendance: true, attendanceError: null });
        try {
          const attendanceRecords = await AttendanceService.getStudentAttendance(studentId);
          set({ attendanceRecords, isLoadingAttendance: false });
        } catch (error: any) {
          set({ attendanceError: error.message || 'Failed to fetch attendance records', isLoadingAttendance: false });
        }
      },
      
      setAttendanceRecords: (records) => set({ attendanceRecords: records }),
      
      fetchAllAttendanceRecords: async () => {
        set({ isLoadingAttendance: true, attendanceError: null });
        try {
          const attendanceRecords = await AttendanceService.getAllAttendance();
          set({ attendanceRecords, isLoadingAttendance: false });
        } catch (error: any) {
          set({ attendanceError: error.message || 'Failed to fetch attendance records', isLoadingAttendance: false });
        }
      },
      
      setBannerMessage: (msg) => set({ bannerMessage: msg }),
      
      clearBannerMessage: () => set({ bannerMessage: null }),
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Attendance store rehydration error:', error);
        }
      },
    }
  )
);