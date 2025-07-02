import { QRCodeData } from '@/types';

// Mock QR code generation utility (in real app, this would be done server-side)
export class QRSecurityUtils {
  
  // Generate a secure signature for QR code data
  static generateSignature(data: Omit<QRCodeData, 'signature'>): string {
    // In a real app, use HMAC-SHA256 or similar cryptographic function
    // This is a simple mock implementation
    const payload = `${data.courseId}-${data.timestamp}-${data.expiresAt}-${data.instructorId}`;
    return payload.split('').reverse().join('');
  }
  
  // Validate QR code signature
  static validateSignature(data: QRCodeData): boolean {
    const expectedSignature = this.generateSignature({
      type: data.type,
      courseId: data.courseId,
      timestamp: data.timestamp,
      expiresAt: data.expiresAt,
      location: data.location,
      instructorId: data.instructorId,
      sessionId: data.sessionId,
    });
    
    return data.signature === expectedSignature;
  }
  
  // Check if QR code is within valid time window
  static isTimeValid(data: QRCodeData): boolean {
    const now = Date.now();
    return now >= data.timestamp && now <= data.expiresAt;
  }
  
  // Generate a mock QR code for testing (instructor would do this)
  static generateMockQRCode(courseId: string, instructorId: string = 'instructor-1'): QRCodeData {
    const now = Date.now();
    const expiresAt = now + (5 * 60 * 1000); // 5 minutes validity
    
    const qrData: Omit<QRCodeData, 'signature'> = {
      type: 'attendance',
      courseId,
      timestamp: now,
      expiresAt,
      location: {
        latitude: -1.2921,
        longitude: 36.8219,
        accuracy: 10
      },
      instructorId,
      sessionId: `session-${now}`
    };
    
    return {
      ...qrData,
      signature: this.generateSignature(qrData)
    };
  }
  
  // Calculate distance between two coordinates in meters
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
  
  // Validate location proximity (within specified radius)
  static isLocationValid(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number,
    maxDistance: number = 100 // meters
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= maxDistance;
  }
}