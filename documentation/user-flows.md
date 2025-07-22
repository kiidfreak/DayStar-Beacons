# User Flows

## 1. Authentication Flow

1. **University Selection**
   - User launches the app
   - Selects their university from the list
   - University information is stored for future sessions

2. **Login**
   - User enters email/student ID and password
   - Credentials are validated
   - Upon successful authentication, user is redirected to the home screen
   - Demo credentials are provided for testing (student@uni.edu / password)

## 2. Automatic Attendance Flow (Beacon)

1. **Background Scanning**
   - App automatically scans for classroom beacons during class times
   - Beacon scanning status is displayed on the home screen

2. **Beacon Detection**
   - When a classroom beacon is detected, the app shows "detected" status
   - Upon successful connection, status changes to "connected"

3. **Attendance Logging**
   - Attendance is automatically recorded with timestamp and location
   - User receives confirmation of successful check-in
   - Current class is highlighted on the home screen

4. **Random Verification**
   - During class, random verification prompts may appear
   - User must confirm presence within 1 minute
   - Failure to confirm may result in attendance being marked as absent

## 3. QR Code Attendance Flow

1. **QR Scanner Access**
   - User taps the QR code icon on the home screen
   - Camera permission is requested if not already granted

2. **QR Scanning**
   - Camera view opens with scanning frame
   - User positions the QR code within the frame

3. **Multi-layer Validation**
   - QR code data is parsed and validated:
     - Time validation: Checks if QR code is still valid (not expired)
     - Location validation: Verifies student is in the correct classroom
     - Signature validation: Ensures QR code hasn't been tampered with
     - Course validation: Confirms the course exists in the student's schedule

4. **Result Handling**
   - Success: Attendance is recorded and confirmation is displayed
   - Failure: Error message explains the reason for failure (expired, wrong location, etc.)
   - Option to retry scanning if validation fails

## 4. Attendance History & Statistics Flow

1. **Viewing History**
   - User navigates to the History tab
   - Complete attendance record is displayed in chronological order
   - Filter options allow viewing by course or date range

2. **Statistics Dashboard**
   - Attendance statistics show present, late, and absent percentages
   - Course-specific attendance rates are displayed
   - Visual indicators highlight attendance trends

## 5. Course Management Flow

1. **Course Listing**
   - User views all enrolled courses
   - Today's classes are highlighted on the home screen

2. **Course Details**
   - Tapping a course shows detailed information
   - Attendance history for the specific course is displayed
   - Schedule and location information is provided

3. **Calendar View**
   - User can view their complete class schedule
   - Calendar highlights days with classes
   - Tapping a day shows all classes scheduled for that day