import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useQRCodeStatus } from '@/hooks/useQRCodeStatus';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';

interface QRCodeStatusProps {
  courseId?: string;
}

export default function QRCodeStatus({ courseId }: QRCodeStatusProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeQRCode, formattedTime, hasActiveQR, isLoading } = useQRCodeStatus(courseId);

  const handleScanQR = () => {
    router.push('/qr-scanner');
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!hasActiveQR) {
    return null; // Don't show anything if no active QR code
  }

  return (
    <Card elevated style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="qrcode" 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              QR Code Available
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {activeQRCode?.courseName}
            </Text>
            <Text style={[styles.timer, { color: colors.warning }]}>
              Expires in {formattedTime}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={handleScanQR}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />
          <Text style={[styles.scanButtonText, { color: 'white' }]}>
            Scan
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  timer: {
    fontSize: 12,
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 