import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ALERT_CONFIG = {
  error: { icon: 'close-circle', color: '#F44336', title: 'Error' },
  success: { icon: 'checkmark-circle', color: '#4CAF50', title: '¡Éxito!' },
  warning: { icon: 'warning', color: '#FCD73E', title: 'Advertencia' },
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
  const isWarning = type === 'warning'; // si es warning, mostramos dos botones

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onCancel || onConfirm}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropColor="#000000"
      backdropOpacity={0.7}
      style={styles.modal}
    >
      <View style={styles.alertContainer}>
        <Ionicons name={config.icon} size={60} color={config.color} style={styles.icon} />

        <Text style={styles.title}>{customTitle || config.title}</Text>
        <Text style={styles.message}>{message}</Text>

        {isWarning ? (
          <View style={styles.warningButtonsContainer}>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: '#CCC' }]}
              onPress={onCancel}
            >
              <Text style={styles.warningButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: config.color }]}
              onPress={onConfirm}
            >
              <Text style={styles.warningButtonText}>Aceptar</Text>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: 'center', alignItems: 'center' },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: width * 0.85,
  },
  icon: { marginBottom: 15 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  warningButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomAlert;
