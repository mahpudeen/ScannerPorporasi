import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';

const ConfirmationModal = ({ visible, title, onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.messageText}>
            {title}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonyes} onPress={onConfirm}>
              <Text style={styles.buttonText}>Ya</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonno} onPress={onCancel}>
              <Text style={styles.buttonText}>Tidak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonyes: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    width: 120,
    marginHorizontal: 8,
  },
  buttonno: {
    backgroundColor: 'red',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 120,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default ConfirmationModal;
