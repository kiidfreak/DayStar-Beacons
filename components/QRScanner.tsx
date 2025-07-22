import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface QRScannerProps {
  onQRCodeScanned: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onQRCodeScanned, onError, onClose }: QRScannerProps) {
  const { themeColors: colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // CameraView uses the same permission API as Camera
      const { status } = await (await import('expo-camera')).Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = (result: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    if (result.data) {
      onQRCodeScanned(result.data);
    } else if (onError) {
      onError('No QR code data found');
    }
  };

  if (hasPermission === null) {
    return <ActivityIndicator />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        autofocus={"on"}
        facing="back"
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons name="close" size={32} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 4,
  },
}); 