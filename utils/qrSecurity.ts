import CryptoJS from 'crypto-js';

const SECRET_KEY = 'your-secret-key-here'; // In production, use environment variable

export interface QRCodeData {
  sessionId: string;
  courseId: string;
  timestamp: number;
  expiresAt: number;
}

export class QRSecurity {
  // Generate QR code data for a session
  static generateQRData(sessionId: string, courseId: string, durationMinutes: number = 15): string {
    const now = Date.now();
    const expiresAt = now + (durationMinutes * 60 * 1000);
    
    const qrData: QRCodeData = {
      sessionId,
      courseId,
      timestamp: now,
      expiresAt,
    };

    const jsonString = JSON.stringify(qrData);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    
    return encrypted;
  }

  // Decrypt and validate QR code data
  static decryptQRData(encryptedData: string): QRCodeData | null {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        console.error('Failed to decrypt QR data');
        return null;
      }

      const qrData: QRCodeData = JSON.parse(jsonString);
      
      // Validate timestamp
      if (Date.now() > qrData.expiresAt) {
        console.error('QR code has expired');
        return null;
      }

      return qrData;
    } catch (error) {
      console.error('Error decrypting QR data:', error);
      return null;
    }
  }

  // Validate QR code for a specific session
  static validateQRCode(encryptedData: string, expectedSessionId: string): boolean {
    const qrData = this.decryptQRData(encryptedData);
    
    if (!qrData) {
      return false;
    }

    // Check if session ID matches
    if (qrData.sessionId !== expectedSessionId) {
      console.error('Session ID mismatch');
      return false;
    }

    // Check if QR code is still valid
    if (Date.now() > qrData.expiresAt) {
      console.error('QR code expired');
      return false;
    }

    return true;
  }

  // Generate a simple QR code for testing
  static generateTestQR(sessionId: string, courseId: string): string {
    const qrData: QRCodeData = {
      sessionId,
      courseId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
    };

    return JSON.stringify(qrData);
  }

  // Parse test QR code
  static parseTestQR(qrString: string): QRCodeData | null {
    try {
      return JSON.parse(qrString) as QRCodeData;
    } catch (error) {
      console.error('Error parsing test QR code:', error);
      return null;
    }
  }

  // Check if QR code is expired
  static isExpired(qrData: QRCodeData): boolean {
    return Date.now() > qrData.expiresAt;
  }

  // Get time remaining for QR code
  static getTimeRemaining(qrData: QRCodeData): number {
    const remaining = qrData.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  // Format time remaining as string
  static formatTimeRemaining(qrData: QRCodeData): string {
    const remaining = this.getTimeRemaining(qrData);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}