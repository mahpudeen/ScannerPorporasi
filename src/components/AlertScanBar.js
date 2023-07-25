import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AlertScanBar = ({ type, message, visible }) => {
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
      <View style={{...styles.container, backgroundColor:bgColor}} visible={visible}>
        <Icon name={iconName} style={{color:textColor}} size={24} />
        <Text style={{...styles.message, color:textColor}}>{message}</Text>
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: '#F5F5F5',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    message: {
      marginLeft: 8,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default AlertScanBar;
  