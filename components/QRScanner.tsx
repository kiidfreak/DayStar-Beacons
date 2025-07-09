import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useTheme } from '@/hooks/useTheme';

interface QRScannerProps {
  onQRCodeScanned: (qrCodeId: string) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

export default function QRScanner({ onQRCodeScanned, onError, onClose }: QRScannerProps) {
  const { themeColors } = useTheme();
  const colors = themeColors || {
    background: '#FFFFFF',
  };
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onQRCodeScanned(data);
  };

  if (hasPermission === null) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }
  if (hasPermission === false) {
    Alert.alert('No access to camera');
    if (onError) onError('No access to camera');
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
// If expo-barcode-scanner is not installed, run:
// expo install expo-barcode-scanner 