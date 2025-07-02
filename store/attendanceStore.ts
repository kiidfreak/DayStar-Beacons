import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord, Course, BeaconStatus, CheckInPrompt, DayOfWeek } from '@/types';

interface AttendanceState {
  courses: Course[];
  attendanceRecords: AttendanceRecord[];
  currentBeaconStatus: BeaconStatus;
  currentCourse: Course | null;
  checkInPrompt: CheckInPrompt | null;
  
  // Actions
  setBeaconStatus: (status: BeaconStatus) => void;
  setCurrentCourse: (course: Course | null) => void;
  logAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  setCheckInPrompt: (prompt: CheckInPrompt | null) => void;
  respondToCheckInPrompt: (confirmed: boolean) => void;
  getTodayCourses: () => Course[];
  getCourseAttendance: (courseId: string) => AttendanceRecord[];
}

// Mock data with location coordinates
const mockCourses: Course[] = [
  {
    id: "course-1",
    name: "Introduction to Computer Science",
    code: "CS101",
    instructor: "Dr. Smith",
    schedule: "Mon, Wed 10:00-11:30",
    room: "Building A, Room 101",
    beaconId: "beacon-101",
    beaconMacAddress: "00:11:22:33:44:55",
    startTime: "10:00",
    endTime: "11:30",
    days: ["Monday", "Wednesday"],
    location: {
      latitude: -1.2921,
      longitude: 36.8219,
      address: "Building A, Room 101, University Campus"
    }
  },
  {
    id: "course-2",
    name: "Data Structures and Algorithms",
    code: "CS201",
    instructor: "Dr. Johnson",
    schedule: "Tue, Thu 13:00-14:30",
    room: "Building B, Room 203",
    beaconId: "beacon-203",
    beaconMacAddress: "AA:BB:CC:DD:EE:FF",
    startTime: "13:00",
    endTime: "14:30",
    days: ["Tuesday", "Thursday"],
    location: {
      latitude: -1.2925,
      longitude: 36.8215,
      address: "Building B, Room 203, University Campus"
    }
  },
  {
    id: "course-3",
    name: "Database Systems",
    code: "CS301",
    instructor: "Prof. Williams",
    schedule: "Wed, Fri 15:00-16:30",
    room: "Building C, Room 305",
    beaconId: "beacon-305",
    beaconMacAddress: "11:22:33:44:55:66",
    startTime: "15:00",
    endTime: "16:30",
    days: ["Wednesday", "Friday"],
    location: {
      latitude: -1.2918,
      longitude: 36.8222,
      address: "Building C, Room 305, University Campus"
    }
  },
  {
    id: "course-4",
    name: "Software Engineering",
    code: "CS401",
    instructor: "Dr. Brown",
    schedule: "Mon, Wed 13:00-14:30",
    room: "Building A, Room 205",
    beaconId: "beacon-205",
    beaconMacAddress: "22:33:44:55:66:77",
    startTime: "13:00",
    endTime: "14:30",
    days: ["Monday", "Wednesday"],
    location: {
      latitude: -1.2920,
      longitude: 36.8218,
      address: "Building A, Room 205, University Campus"
    }
  },
  {
    id: "course-5",
    name: "Computer Networks",
    code: "CS302",
    instructor: "Prof. Davis",
    schedule: "Tue, Thu 10:00-11:30",
    room: "Building B, Room 105",
    beaconId: "beacon-105",
    beaconMacAddress: "33:44:55:66:77:88",
    startTime: "10:00",
    endTime: "11:30",
    days: ["Tuesday", "Thursday"],
    location: {
      latitude: -1.2923,
      longitude: 36.8217,
      address: "Building B, Room 105, University Campus"
    }
  }
];

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "att-1",
    courseId: "course-1",
    courseName: "Introduction to Computer Science",
    courseCode: "CS101",
    date: "2025-06-10",
    checkInTime: "10:05",
    status: "present",
    location: {
      latitude: -1.2921,
      longitude: 36.8219,
      accuracy: 5
    }
  },
  {
    id: "att-2",
    courseId: "course-2",
    courseName: "Data Structures and Algorithms",
    courseCode: "CS201",
    date: "2025-06-09",
    checkInTime: "13:10",
    status: "present",
    location: {
      latitude: -1.2925,
      longitude: 36.8215,
      accuracy: 8
    }
  },
  {
    id: "att-3",
    courseId: "course-3",
    courseName: "Database Systems",
    courseCode: "CS301",
    date: "2025-06-08",
    checkInTime: "15:20",
    status: "qr",
    location: {
      latitude: -1.2918,
      longitude: 36.8222,
      accuracy: 12
    }
  },
  {
    id: "att-4",
    courseId: "course-1",
    courseName: "Introduction to Computer Science",
    courseCode: "CS101",
    date: "2025-06-03",
    checkInTime: "10:08",
    status: "present",
    location: {
      latitude: -1.2921,
      longitude: 36.8219,
      accuracy: 6
    }
  },
  {
    id: "att-5",
    courseId: "course-1",
    courseName: "Introduction to Computer Science",
    courseCode: "CS101",
    date: "2025-05-29",
    checkInTime: "10:15",
    status: "late",
    location: {
      latitude: -1.2921,
      longitude: 36.8219,
      accuracy: 10
    }
  },
  {
    id: "att-6",
    courseId: "course-2",
    courseName: "Data Structures and Algorithms",
    courseCode: "CS201",
    date: "2025-06-04",
    checkInTime: "13:05",
    status: "present",
    location: {
      latitude: -1.2925,
      longitude: 36.8215,
      accuracy: 7
    }
  },
  {
    id: "att-7",
    courseId: "course-4",
    courseName: "Software Engineering",
    courseCode: "CS401",
    date: "2025-06-10",
    checkInTime: "13:12",
    status: "present",
    location: {
      latitude: -1.2920,
      longitude: 36.8218,
      accuracy: 9
    }
  },
  {
    id: "att-8",
    courseId: "course-5",
    courseName: "Computer Networks",
    courseCode: "CS302",
    date: "2025-06-11",
    checkInTime: "10:07",
    status: "present",
    location: {
      latitude: -1.2923,
      longitude: 36.8217,
      accuracy: 4
    }
  }
];

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      courses: mockCourses,
      attendanceRecords: mockAttendanceRecords,
      currentBeaconStatus: 'scanning',
      currentCourse: null,
      checkInPrompt: null,
      
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
        
        return get().courses.filter(course => 
          course.days?.includes(dayOfWeek)
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
          .filter(record => record.courseId === courseId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Add error handling for persistence
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Attendance store rehydration error:', error);
        }
      },
    }
  )
);