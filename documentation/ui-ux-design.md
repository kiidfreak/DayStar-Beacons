# UI/UX Design System

The University Attendance Tracking System implements a modern, clean design system inspired by iOS, Instagram, Airbnb, Notion, and Linear. The design prioritizes usability, clarity, and a professional aesthetic suitable for an educational application.

## 1. Color System

The application uses a dual-theme color system with light and dark modes:

### Light Theme
- **Primary**: #00AEEF (Daystar blue) - Used for primary actions and branding
- **Secondary**: #3DDAB4 (Teal) - Used for secondary elements and accents
- **Background**: #FFFFFF - Main app background
- **Card**: #F7F9FC - Card and container backgrounds
- **Text**: #1A1D1F - Primary text color
- **Text Secondary**: #6C7072 - Secondary and less important text
- **Border**: #E8ECF4 - Subtle borders and dividers
- **Success**: #34C759 - Positive actions and confirmations
- **Warning**: #FF9500 - Warnings and cautions
- **Error**: #FF3B30 - Errors and destructive actions

### Dark Theme
- **Primary**: #00AEEF (Consistent with light theme)
- **Secondary**: #3DDAB4 (Consistent with light theme)
- **Background**: #121212 - Dark background
- **Card**: #1E1E1E - Dark card backgrounds
- **Text**: #FFFFFF - Light text on dark background
- **Text Secondary**: #ADADAD - Secondary text in dark mode
- **Border**: #2C2C2C - Subtle borders in dark mode
- **Success/Warning/Error**: Consistent with light theme

## 2. Component Library

The application uses a custom component library built specifically for the attendance system:

### Core Components

- **Button**: Multi-variant button (primary, secondary, outline, text)
- **Card**: Container component with optional gradient and elevation
- **Badge**: Status indicators for attendance states
- **Avatar**: User profile images with fallback initials
- **Logo**: University branding component
- **EmptyState**: Standardized empty state pattern

### Specialized Components

- **BeaconStatus**: Visual indicator of beacon connection state
- **ClassCard**: Course information display with status
- **HistoryItem**: Attendance record display
- **RandomCheckPrompt**: Modal for random verification
- **NotificationBell**: Notification indicator and access
- **AttendanceStats**: Visual attendance statistics
- **CalendarView**: Schedule visualization
- **Sidebar**: Navigation drawer

## 3. Typography System

The application uses a consistent typography system with defined text styles:

- **Headings**: Bold, clear headings for section titles (18-24px)
- **Body Text**: Clean, readable text for content (14-16px)
- **Caption Text**: Smaller text for secondary information (12-14px)
- **Emphasis**: Bold or colored text for important information
- **Interactive Text**: Clear indicators for tappable text elements

## 4. Layout Patterns

The application uses consistent layout patterns throughout:

- **Card-Based Layout**: Information is organized in card containers
- **List Views**: Consistent list patterns for courses and history
- **Section Headers**: Clear section dividers with action buttons
- **Safe Area Respecting**: All screens properly respect device safe areas
- **Responsive Spacing**: Consistent padding and margins (multiples of 4px)
- **Grid System**: Flexible grid for organizing content

## 5. Navigation Patterns

- **Stack Navigation**: For hierarchical screen relationships
- **Sidebar Navigation**: For accessing main app sections
- **Modal Presentations**: For focused tasks like QR scanning
- **Back Navigation**: Consistent back button behavior

## 6. Animation & Feedback

- **Haptic Feedback**: Tactile response for important actions
- **Status Transitions**: Smooth animations for state changes
- **Loading States**: Clear loading indicators
- **Success/Error States**: Visual feedback for action outcomes

## 7. Accessibility Considerations

- **Color Contrast**: Meets WCAG AA standards for readability
- **Text Sizing**: Supports dynamic text sizes
- **Screen Reader Support**: Semantic structure for assistive technologies
- **Touch Targets**: Appropriately sized for easy interaction (minimum 44×44 points)

## 8. Design Principles

The UI/UX design follows these core principles:

1. **Clarity**: Information is presented clearly and directly
2. **Efficiency**: Tasks can be completed with minimal steps
3. **Consistency**: Patterns and components are used consistently
4. **Feedback**: Users receive clear feedback for all actions
5. **Hierarchy**: Visual hierarchy guides users to important elements
6. **Accessibility**: Design works for all users regardless of abilities