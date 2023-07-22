import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AlertBar = ({ type, message, visible }) => {
    let iconName, iconColor;
  
    switch (type) {
      case 'warning':
        iconName = 'exclamation-triangle';
        iconColor = '#FFCC00';
        break;
      case 'success':
        iconName = 'check-circle';
        iconColor = '#339900';
        break;
      case 'failed':
        iconName = 'times-circle';
        iconColor = '#CC3300';
        break;
      case 'info':
      default:
        iconName = 'info-circle';
        iconColor = '#A1D276';
        break;
    }
    if (!visible) {
        return null; // Don't render anything if visible prop is false
    }
    return (
      <View style={{...styles.container, backgroundColor:iconColor}} visible={visible}>
        <Icon name={iconName} size={24} />
        <Text style={styles.message}>{message}</Text>
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      backgroundColor: '#F5F5F5',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    message: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default AlertBar;
  