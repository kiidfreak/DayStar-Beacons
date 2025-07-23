import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord, Course, BeaconStatus, CheckInPrompt, DayOfWeek, CourseSession } from '@/types';
import { CourseService } from '@/services/courseService';
import { AttendanceService } from '@/services/attendanceService';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface AttendanceState {
  // State
  attendanceRecords: AttendanceRecord[];
  currentSession: CourseSession | null;
  isLoading: boolean;
  error: string | null;
  bannerMessage: string | null;
  beaconStatus: 'scanning' | 'detected' | 'connected' | 'error' | 'inactive';
  currentCourse: { id: string; name: string } | null;
  
  // Actions
  fetchAttendanceRecords: () => Promise<void>;
  markAttendance: (sessionId: string, method: string) => Promise<boolean>;
  setBannerMessage: (message: string | null) => void;
  clearBannerMessage: () => void;
  setBeaconStatus: (status: 'scanning' | 'detected' | 'connected' | 'error' | 'inactive') => void;
  setCurrentCourse: (course: { id: string; name: string } | null) => void;
  startRealtimeSubscriptions: () => void;
  stopRealtimeSubscriptions: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  // Initial state
  attendanceRecords: [],
  currentSession: null,
  isLoading: false,
  error: null,
  bannerMessage: null,
  beaconStatus: 'inactive',
  currentCourse: null,

  // Fetch attendance records
  fetchAttendanceRecords: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          student_id,
          session_id,
          course_code,
          check_in_time,
          status,
          created_at
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attendance records:', error);
        set({ error: error.message });
        return;
      }

      set({ attendanceRecords: data || [] });
    } catch (error) {
      console.error('Error in fetchAttendanceRecords:', error);
      set({ error: 'Failed to fetch attendance records' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Mark attendance with optimized performance
  markAttendance: async (sessionId: string, method: string) => {
    console.log('📝 markAttendance called with sessionId:', sessionId, 'method:', method);
    
    const { user } = useAuthStore.getState();
    if (!user) {
      console.log('❌ No user found, cannot mark attendance');
      return false;
    }

    // Set loading state immediately for better UX
    set({ isLoading: true, error: null });

    try {
      // Check if already marked attendance for this session (optimized)
      const state = get();
      const existingRecord = state.attendanceRecords.find(
        record => record.session_id === sessionId
      );

      if (existingRecord) {
        console.log('⚠️ Attendance already marked for this session');
        set({ 
          bannerMessage: 'Attendance already marked for this session',
          isLoading: false 
        });
        return false;
      }

      // Optimistic UI update - show success immediately
      const optimisticRecord = {
        id: `temp-${Date.now()}`, // Temporary ID
        student_id: user.id,
        session_id: sessionId,
        course_code: 'Loading...', // Will be updated
        course_name: 'Loading...', // Will be updated
        check_in_time: new Date().toISOString(),
        status: 'present' as const,
        method: method === 'beacon' ? 'BLE' : method === 'qr' ? 'QR' : 'MANUAL',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        verified_by: null
      };

      // Update UI immediately (optimistic update)
      set(state => ({
        attendanceRecords: [optimisticRecord, ...state.attendanceRecords],
        bannerMessage: 'Attendance marked successfully!',
        isLoading: false
      }));

      // Perform background operations without blocking UI
      setTimeout(async () => {
        try {
          console.log('🔍 Fetching session details in background...');
          
          // Get session details
          const { data: sessionData, error: sessionError } = await supabase
            .from('class_sessions')
            .select(`
              id,
              course_id,
              courses!inner(name, code)
            `)
            .eq('id', sessionId)
            .single();

          if (sessionError || !sessionData) {
            throw new Error('Session not found');
          }

          // Map method to correct enum value
          let dbMethod = method;
          if (method === 'beacon') dbMethod = 'BLE';
          else if (method === 'qr') dbMethod = 'QR';
          else if (method === 'manual') dbMethod = 'MANUAL';

          const courseObj = Array.isArray(sessionData.courses) ? sessionData.courses[0] : sessionData.courses;

          // Insert actual record
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance_records')
            .insert({
              student_id: user.id,
              session_id: sessionId,
              course_code: courseObj.code,
              course_name: courseObj.name,
              check_in_time: optimisticRecord.check_in_time,
              status: 'present',
              method: dbMethod,
              date: optimisticRecord.date,
            })
            .select()
            .single();

          if (attendanceError) {
            throw new Error('Failed to record attendance');
          }

          // Update the optimistic record with real data
          set(state => ({
            attendanceRecords: state.attendanceRecords.map(record => 
              record.id === optimisticRecord.id ? attendanceData : record
            ),
            currentSession: {
              id: sessionId,
              course_id: sessionData.course_id,
              course_code: courseObj.code,
              course_name: courseObj.name,
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
              is_active: true,
            }
          }));

          console.log('✅ Background attendance recording completed');
        } catch (backgroundError) {
          console.error('❌ Background error:', backgroundError);
          
          // Revert optimistic update on error
          set(state => ({
            attendanceRecords: state.attendanceRecords.filter(record => record.id !== optimisticRecord.id),
            bannerMessage: 'Failed to mark attendance - please try again',
            error: backgroundError instanceof Error ? backgroundError.message : 'Unknown error'
          }));
        }
      }, 0); // Execute in next tick

      return true;
    } catch (error) {
      console.error('❌ Error in markAttendance:', error);
      set({ 
        bannerMessage: 'Failed to mark attendance',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  // Banner message actions with auto-clear
  setBannerMessage: (message: string | null) => {
    set({ bannerMessage: message });
    
    // Auto-clear success messages after 3 seconds
    if (message && !message.toLowerCase().includes('error') && !message.toLowerCase().includes('failed')) {
      setTimeout(() => {
        set(state => ({ 
          bannerMessage: state.bannerMessage === message ? null : state.bannerMessage 
        }));
      }, 3000);
    }
  },

  clearBannerMessage: () => {
    set({ bannerMessage: null });
  },

  // Beacon status actions
  setBeaconStatus: (status: 'scanning' | 'detected' | 'connected' | 'error' | 'inactive') => {
    set({ beaconStatus: status });
  },

  setCurrentCourse: (course: { id: string; name: string } | null) => {
    set({ currentCourse: course });
  },

  // Real-time subscriptions
  startRealtimeSubscriptions: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    console.log('Starting real-time subscriptions for attendance...');

    // Subscribe to attendance records
    const attendanceSubscription = supabase
      .channel('attendance_records')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Attendance record change:', payload);
          get().fetchAttendanceRecords();
        }
      )
      .subscribe();

    // Subscribe to class sessions
    const sessionsSubscription = supabase
      .channel('class_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_sessions',
        },
        (payload) => {
          console.log('Class session change:', payload);
          // Could update current session if needed
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    set({ 
      // @ts-ignore - storing subscriptions for cleanup
      _subscriptions: [attendanceSubscription, sessionsSubscription] 
    });
  },

  stopRealtimeSubscriptions: () => {
    // @ts-ignore - accessing stored subscriptions
    const { _subscriptions } = get();
    if (_subscriptions) {
      _subscriptions.forEach((subscription: any) => {
        supabase.removeChannel(subscription);
      });
    }
    console.log('Stopped real-time subscriptions');
  },
}));