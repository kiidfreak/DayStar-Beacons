import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

// Fallback device info when expo-device is not available
const getFallbackDeviceInfo = () => ({
  deviceName: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
  modelName: Platform.OS === 'ios' ? 'iPhone' : 'Android',
  manufacturer: Platform.OS === 'ios' ? 'Apple' : 'Google',
  deviceType: 'unknown'
});

// Try to import expo-device, fallback if not available
let Device: any;
try {
  Device = require('expo-device');
} catch (error) {
  console.log('expo-device not available, using fallback');
  Device = { isDevice: true, ...getFallbackDeviceInfo() };
}

// Try to import expo-application, fallback if not available
let Application: any;
try {
  Application = require('expo-application');
} catch (error) {
  console.log('expo-application not available, using fallback');
  Application = {
    applicationId: 'com.rork.app',
    nativeApplicationVersion: '1.0.0',
    nativeBuildVersion: '1'
  };
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  model: string;
  manufacturer: string;
  appVersion: string;
  buildVersion: string;
  deviceType: string;
}

export class DeviceBindingService {
  /**
   * Generate a unique device identifier
   */
  static async generateDeviceId(): Promise<string> {
    try {
      // Use multiple identifiers for better uniqueness
      const deviceName = Device.deviceName || 'Unknown';
      const model = Device.modelName || 'Unknown';
      const manufacturer = Device.manufacturer || 'Unknown';
      const appId = Application.applicationId || 'com.rork.app';
      
      // Create a hash of device characteristics
      const deviceString = `${deviceName}-${model}-${manufacturer}-${appId}`;
      const hash = await this.hashString(deviceString);
      
      return `device_${hash}`;
    } catch (error) {
      console.error('Error generating device ID:', error);
      // Fallback to a simple identifier
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get comprehensive device information
   */
  static async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const deviceId = await this.generateDeviceId();
      
      return {
        deviceId,
        deviceName: Device.deviceName || 'Unknown Device',
        platform: Platform.OS,
        model: Device.modelName || 'Unknown Model',
        manufacturer: Device.manufacturer || 'Unknown Manufacturer',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        buildVersion: Application.nativeBuildVersion || '1',
        deviceType: Device.deviceType || 'unknown',
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Register device for a user
   */
  static async registerDevice(userId: string): Promise<boolean> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      // Check if device is already registered for this user
      const { data: existingDevice, error: checkError } = await supabase
        .from('users')
        .select('device_id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing device:', checkError);
        throw checkError;
      }

      // If device is already registered, verify it matches
      if (existingDevice?.device_id) {
        if (existingDevice.device_id === deviceInfo.deviceId) {
          console.log('Device already registered and verified');
          return true;
        } else {
          throw new Error('This account is already bound to a different device');
        }
      }

      // Register the device
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          device_id: deviceInfo.deviceId,
          device_info: deviceInfo,
          device_registered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error registering device:', updateError);
        throw updateError;
      }

      console.log('Device registered successfully');
      return true;
    } catch (error) {
      console.error('Error in registerDevice:', error);
      throw error;
    }
  }

  /**
   * Verify device binding for a user
   */
  static async verifyDeviceBinding(userId: string): Promise<boolean> {
    try {
      const currentDeviceInfo = await this.getDeviceInfo();
      
      // Get user's registered device
      const { data: user, error } = await supabase
        .from('users')
        .select('device_id, device_info')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user device info:', error);
        throw error;
      }

      if (!user?.device_id) {
        // No device registered, allow first-time registration
        console.log('No device registered, allowing registration');
        return true;
      }

      // Check if current device matches registered device
      const isDeviceMatch = user.device_id === currentDeviceInfo.deviceId;
      
      if (!isDeviceMatch) {
        console.error('Device binding verification failed');
        console.log('Registered device:', user.device_id);
        console.log('Current device:', currentDeviceInfo.deviceId);
        return false;
      }

      console.log('Device binding verification successful');
      return true;
    } catch (error) {
      console.error('Error in verifyDeviceBinding:', error);
      return false;
    }
  }

  /**
   * Check if user can change device (for admin approval)
   */
  static async requestDeviceChange(userId: string, reason: string): Promise<boolean> {
    try {
      const currentDeviceInfo = await this.getDeviceInfo();
      
      const { error } = await supabase
        .from('device_change_requests')
        .insert({
          user_id: userId,
          current_device_id: currentDeviceInfo.deviceId,
          reason: reason,
          status: 'pending',
          requested_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error requesting device change:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in requestDeviceChange:', error);
      throw error;
    }
  }

  /**
   * Simple hash function for device string
   */
  private static async hashString(str: string): Promise<string> {
    // Simple hash implementation
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get device binding status for display
   */
  static async getDeviceBindingStatus(userId: string): Promise<{
    isBound: boolean;
    deviceInfo?: DeviceInfo;
    canChange: boolean;
  }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('device_id, device_info')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching device binding status:', error);
        return { isBound: false, canChange: true };
      }

      const isBound = !!user?.device_id;
      const currentDeviceInfo = await this.getDeviceInfo();
      
      return {
        isBound,
        deviceInfo: isBound ? user.device_info : currentDeviceInfo,
        canChange: true, // For now, allow changes
      };
    } catch (error) {
      console.error('Error in getDeviceBindingStatus:', error);
      return { isBound: false, canChange: true };
    }
  }
} 