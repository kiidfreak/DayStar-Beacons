# rork-uniconnect-attendance-system
Created by Nexus labs


npx expo start -c

npx expo run:android



## 🚀 Getting Started

### 1. **Clone the Repository**
```sh
git clone https://github.com/your-org/your-repo.git
cd your-repo
```

### 2. **Install Dependencies**
```sh
npm install
# or
yarn install
```

### 3. **Set Up Environment Variables**
- Copy `.env.example` to `.env` and fill in your Supabase credentials and any other required values.

### 4. **Install Pods (iOS only)**
```sh
cd ios
pod install
cd ..
```

### 5. **Configure Android Environment**
- Make sure you have Android Studio, Android SDK, and a real Android device (BLE does **not** work on emulators).
- Set up your `ANDROID_HOME` environment variable if needed.

### 6. **Run the App**
#### **Android**
```sh
npx react-native run-android
```
#### **iOS**
```sh
npx react-native run-ios
```
> **Note:** BLE features require a real device.

### 7. **BLE Permissions**
- Accept all Bluetooth and Location permissions on your device when prompted.

### 8. **Supabase Setup**
- Ensure your Supabase project has the required tables (`users`, `class_sessions`, `ble_beacons`, `attendance_records`, etc.).
- Each `class_session` should be linked to a `ble_beacon` with the correct MAC address.

### 9. **BLE Testing**
- Make sure your beacon is powered on and advertising.
- The app will scan for the beacon and log attendance when detected.

---

## 🛠️ Troubleshooting

- **BLE not working?**  
  - Use a real device, not an emulator.
  - Check permissions and beacon power.
  - Watch Metro logs for debug output.

- **Attendance not logging?**  
  - Ensure your Supabase has a session for today, for your user, with the correct beacon MAC.

---

## 📚 Useful Scripts

- **Start Metro Bundler:**  
  ```sh
  npx react-native start
  ```
- **Clean Android Build:**  
  ```sh
  cd android && ./gradlew clean && cd ..
  ```

---