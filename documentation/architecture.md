# Architecture & Technical Implementation

## Tech Stack

- **Frontend Framework**: React Native with Expo SDK 52
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router (file-based routing similar to Next.js)
- **UI Components**: Custom component library with theming support
- **Hardware Integration**: Camera (QR scanning), Location Services, BLE (simulated)

## Application Architecture

The application follows a modular architecture with clear separation of concerns:

### 1. Core Layers

- **UI Layer**: React Native components and screens
- **State Management Layer**: Zustand stores for global state
- **Service Layer**: Hooks and utilities for business logic
- **Data Persistence Layer**: AsyncStorage with Zustand middleware

### 2. Directory Structure

```
├── app/                  # Expo Router pages and navigation
│   ├── (auth)/           # Authentication routes
│   ├── course/           # Course-specific routes
│   └── _layout.tsx       # Root layout and navigation configuration
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components (Button, Card, etc.)
│   └── ...               # Feature-specific components
├── hooks/                # Custom React hooks
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # App constants and configuration
└── styles/               # Global styles
```

### 3. State Management

The application uses Zustand for state management with several key stores:

- **authStore**: Manages user authentication state
- **attendanceStore**: Handles attendance records and course data
- **themeStore**: Controls app theming (light/dark mode)
- **universityStore**: Manages university selection and information

### 4. Navigation Flow

The app uses Expo Router for file-based navigation with the following structure:

- **/(auth)**: Authentication screens (login, university selection)
- **/index**: Main dashboard (home screen)
- **/courses**: Course listing
- **/course/[id]**: Individual course details
- **/history**: Attendance history
- **/qr-scanner**: QR code scanning modal
- **/settings**: App settings
- **/profile**: User profile
- **/calendar**: Schedule calendar view

### 5. Data Flow

1. User authenticates via the auth store
2. App loads course and attendance data from the attendance store
3. BLE scanning or QR code scanning triggers attendance verification
4. Verified attendance is logged to the attendance store and persisted
5. UI components reactively update based on state changes