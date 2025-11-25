import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const GOLD = '#E7C773';
const GOLD_LIGHT = '#FFE9A6';
const BLACK_SOFT = '#333';

const ALERT_CONFIG = {
  error: { icon: 'close-circle', color: '#FF4F4F', title: 'Error' },
  success: { icon: 'checkmark-circle', color: '#4CAF50', title: '¡Éxito!' },
  warning: { icon: 'warning', color: GOLD, title: 'Advertencia' },
};

const CustomAlert = ({
  isVisible,
  type = 'error',
  message,
  onConfirm,
  onCancel,
  customTitle,
}) => {
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.error;
  const isWarning = type === 'warning';

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel || onConfirm}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropColor="#000"
      backdropOpacity={0.4}
      style={styles.modal}
    >
      <BlurView intensity={85} tint="light" style={styles.blurWrapper}>
        <View style={styles.alertContainer}>
          
          <Ionicons
            name={config.icon}
            size={70}
            color={config.color}
            style={styles.icon}
          />

          <Text style={styles.title}>{customTitle || config.title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isWarning ? (
            <View style={styles.warningButtonsContainer}>
              <TouchableOpacity
                style={[styles.warningButton, { backgroundColor: '#EAEAEA' }]}
                onPress={onCancel}
              >
                <Text style={[styles.warningButtonText, { color: '#444' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.warningButton, { backgroundColor: GOLD }]}
                onPress={onConfirm}
              >
                <Text style={[styles.warningButtonText, { color: BLACK_SOFT }]}>
                  Aceptar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: config.color }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Aceptar</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: 'center', alignItems: 'center' },

  blurWrapper: {
    width: width * 0.87,
    borderRadius: 22,
    overflow: 'hidden',
  },

  alertContainer: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: 30,
    borderRadius: 22,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(231,199,115,0.35)', // borde gold suave
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },

  icon: { marginBottom: 18 },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },

  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#444',
  },

  confirmButton: {
    paddingVertical: 12,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },

  confirmButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  warningButtonsContainer: {
    flexDirection: 'row',
    width: '85%',
    justifyContent: 'space-between',
  },

  warningButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
  },

  warningButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomAlert;