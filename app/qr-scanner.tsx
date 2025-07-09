import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function QRScannerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeRead = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const { data: result, error } = await supabase.rpc('validate_and_record_attendance', {
      prompt_id: data,
      student_id: user.id,
    });
    if (error || result?.error) {
      Alert.alert('Error', error?.message || result?.error);
      setScanned(false);
    } else {
      Alert.alert('Success', 'Attendance recorded!');
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        style={StyleSheet.absoluteFill}
        onBarCodeRead={handleBarCodeRead}
        captureAudio={false}
      />
      {scanned && (
        <View style={styles.center}>
          <Text>QR Code scanned!</Text>
          <TouchableOpacity onPress={() => setScanned(false)} style={styles.button}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)'
  },
  button: { marginTop: 20, padding: 12, backgroundColor: '#2196F3', borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});