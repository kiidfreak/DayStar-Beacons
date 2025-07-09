import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRScanner from '@/components/QRScanner';
import { QRCodeService } from '@/services/qrCodeService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const { width: screenWidth } = Dimensions.get('window');

export default function QRScannerScreen() {
  const { user } = useAuthStore();
  const { themeColors } = useThemeStore();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    courseName?: string;
  } | null>(null);

  // Fallback colors to prevent undefined errors
  const colors = themeColors || {
    background: '#FFFFFF',
    card: '#F7F9FC',
    text: '#1A1D1F',
    textSecondary: '#6C7072',
    primary: '#00AEEF',
    secondary: '#3DDAB4',
    border: '#E8ECF4',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    inactive: '#C5C6C7',
    highlight: '#E6F7FE',
  };

  const handleQRCodeScanned = async (qrCodeId: string) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to check in');
      return;
    }

    setCheckingIn(true);
    setIsScanning(false);

    try {
      console.log('QR Scanner Screen: Processing QR code', qrCodeId);
      const result = await QRCodeService.validateQRCode(qrCodeId, user.id);
      
      setLastScanResult({
        success: result.success,
        message: result.message,
        courseName: result.courseName,
      });

      if (result.success) {
        Alert.alert(
          'Check-in Successful! 🎉',
          `You have been checked in for ${result.courseName}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setLastScanResult(null);
                setIsScanning(true);
              }
            }
          ]
        );
      } else {
        Alert.alert('Check-in Failed', result.message, [
          { 
            text: 'OK', 
            onPress: () => {
              setLastScanResult(null);
              setIsScanning(true);
            }
          }
        ]);
      }
    } catch (error) {
      console.error('QR Scanner Screen: Error processing QR code', error);
      Alert.alert('Error', 'An unexpected error occurred', [
        { 
          text: 'OK', 
          onPress: () => {
            setLastScanResult(null);
            setIsScanning(true);
          }
        }
      ]);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleError = (error: string) => {
    Alert.alert('Scanner Error', error);
  };

  const handleClose = () => {
    router.back();
  };

  if (checkingIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Processing check-in...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            Please wait while we verify your attendance
          </Text>
        </View>
      </View>
    );
  }

  if (isScanning) {
    return (
      <QRScanner
        onQRCodeScanned={handleQRCodeScanned}
        onError={handleError}
        onClose={handleClose}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleClose}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          QR Code Check-in
        </Text>
      </View>

      <View style={styles.content}>
        <Card elevated style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons 
            name="qrcode-scan" 
            size={48} 
            color={colors.primary} 
          />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Scan QR Code
          </Text>
          <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
            Scan the QR code displayed by your instructor to check in for attendance
          </Text>
        </Card>

        {lastScanResult && (
          <Card elevated style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons 
                name={lastScanResult.success ? "check-circle" : "alert-circle"} 
                size={24} 
                color={lastScanResult.success ? colors.success : colors.error} 
              />
              <Text style={[
                styles.resultTitle, 
                { color: lastScanResult.success ? colors.success : colors.error }
              ]}>
                {lastScanResult.success ? 'Success' : 'Failed'}
              </Text>
            </View>
            <Text style={[styles.resultMessage, { color: colors.text }]}>
              {lastScanResult.message}
            </Text>
            {lastScanResult.courseName && (
              <Text style={[styles.courseName, { color: colors.primary }]}>
                Course: {lastScanResult.courseName}
              </Text>
            )}
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Start Scanning"
            onPress={() => setIsScanning(true)}
            style={styles.scanButton}
          />
        </View>

        <View style={styles.instructions}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            How to use:
          </Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Wait for your instructor to display a QR code
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Point your camera at the QR code
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Your attendance will be recorded automatically
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: screenWidth > 400 ? 24 : 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultCard: {
    padding: 16,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  scanButton: {
    paddingVertical: 16,
  },
  instructions: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});