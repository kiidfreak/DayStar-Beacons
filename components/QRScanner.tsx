import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface QRScannerProps {
  onQRCodeScanned: (qrCodeId: string) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

export default function QRScanner({ onQRCodeScanned, onError, onClose }: QRScannerProps) {
  const { colors } = useTheme();
  const [qrCodeInput, setQrCodeInput] = useState('');

  const handleSubmit = () => {
    if (qrCodeInput.trim()) {
      onQRCodeScanned(qrCodeInput.trim());
      setQrCodeInput('');
    } else {
      onError('Please enter a valid QR code');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

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
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons 
            name="qrcode" 
            size={64} 
            color={colors.primary} 
          />
        </View>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Enter QR Code
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Please enter the QR code displayed by your instructor
        </Text>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter QR code here..."
            placeholderTextColor={colors.textSecondary}
            value={qrCodeInput}
            onChangeText={setQrCodeInput}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <MaterialCommunityIcons name="check" size={20} color="white" />
          <Text style={[styles.submitButtonText, { color: 'white' }]}>
            Check In
          </Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            How to use:
          </Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Ask your instructor for the QR code
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Enter the code in the field above
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Tap "Check In" to record attendance
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
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    width: '100%',
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