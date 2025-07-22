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

  // Mark attendance
  markAttendance: async (sessionId: string, method: string) => {
    console.log('📝 markAttendance called with sessionId:', sessionId, 'method:', method);
    
    const { user } = useAuthStore.getState();
    if (!user) {
      console.log('❌ No user found, cannot mark attendance');
      return false;
    }

    console.log('👤 User found:', user.id);

    try {
      // Check if already marked attendance for this session
      const existingRecord = get().attendanceRecords.find(
        record => record.session_id === sessionId
      );

      if (existingRecord) {
        console.log('⚠️ Attendance already marked for this session');
        set({ bannerMessage: 'Attendance already marked for this session' });
        return false;
      }

      console.log('🔍 Fetching session details...');
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

      console.log('📊 Session query result:', { sessionData, sessionError });

      if (sessionError || !sessionData) {
        console.error('❌ Error fetching session:', sessionError);
        set({ bannerMessage: 'Session not found' });
        return false;
      }

      console.log('📝 Creating attendance record...');
      // Map method to correct enum value
      let dbMethod = method;
      if (method === 'beacon') dbMethod = 'BLE';
      else if (method === 'qr') dbMethod = 'QR';
      else if (method === 'manual') dbMethod = 'MANUAL';

      // Fix sessionData.courses usage (array or object)
      const courseObj = Array.isArray(sessionData.courses) ? sessionData.courses[0] : sessionData.courses;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          student_id: user.id,
          session_id: sessionId,
          course_code: courseObj.code,
          course_name: courseObj.name, // Add course_name for BLE and all check-ins
          check_in_time: new Date().toISOString(),
          status: 'present',
          method: dbMethod,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      console.log('📊 Attendance insert result:', { attendanceData, attendanceError });

      if (attendanceError) {
        console.error('❌ Error marking attendance:', attendanceError);
        set({ bannerMessage: 'Failed to mark attendance' });
        return false;
      }

      console.log('✅ Attendance marked successfully, updating local state...');
      // Update local state
      set(state => ({
        attendanceRecords: [attendanceData, ...state.attendanceRecords],
        bannerMessage: 'Attendance marked successfully!',
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

      console.log('✅ markAttendance completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in markAttendance:', error);
      set({ bannerMessage: 'Failed to mark attendance' });
      return false;
    }
  },

  // Banner message actions
  setBannerMessage: (message: string | null) => {
    set({ bannerMessage: message });
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