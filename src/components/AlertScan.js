import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AlertScan = ({ visible, title, type, onConfirm }) => {
  let iconName, bgColor, textColor;
  
  switch (type) {
    case 'warning':
      iconName = 'exclamation-triangle';
      bgColor = '#FFE975';
      textColor = '#404040';
      break;
    case 'success':
      iconName = 'check-circle';
      bgColor = '#05944F';
      textColor = '#E1E1E1';
      break;
    case 'failed':
      iconName = 'times-circle';
      bgColor = '#E11900';
      textColor = '#CCCCCC';
      break;
    case 'info':
    default:
      iconName = 'info-circle';
      bgColor = '#A1D276';
      textColor = '#333333';
      break;
  }
  if (!visible) {
      return null; // Don't render anything if visible prop is false
  }
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={{...styles.modalContent, backgroundColor: bgColor, color:textColor}}>
          <Icon name={iconName} size={24} style={{color:textColor}}/>
          <Text style={styles.messageText}>
            <Text style={{...styles.message, color:textColor}}>{title}</Text>
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={{...styles.button,backgroundColor: bgColor, borderColor:textColor}} onPress={onConfirm}>
              <Text style={{...styles.buttonText, color:textColor }}>Ok</Text>
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
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: 300,
  },
  messageText: {
    fontSize: 18,
    marginBottom: 20,
    marginTop: 5,
    textAlign: 'center',
  },
  message: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    width: 90,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default AlertScan;
