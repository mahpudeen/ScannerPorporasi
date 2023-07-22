import React, { useState, useCallback } from 'react';
import { View, Button, Text, StyleSheet, Image, TextInput, Modal, TouchableOpacity } from 'react-native';
import ConfirmationModal from './../../components/ConfirmationModal';
import Logo from '../../../assets/logo.png';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogoutScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const [isModalGateVisible, setModalGateVisible] = useState(false);
  const [gateValue, setGateValue] = useState('');
  const [tempGateValue, setTempGateValue] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [roleCode, setRoleCode] = useState('');

  
  useFocusEffect(
    useCallback(() => {
      getGateValueFromStorage();
      getBrowseSession();
    }, [])
  );

  async function getBrowseSession() {
    const browseSession = await AsyncStorage.getItem('browseSession');
    if (browseSession) {
      const { roleCode } = JSON.parse(browseSession);
      setRoleCode(roleCode);
    }
  }
  
  const getGateValueFromStorage = async () => {
    try {
      const value = await AsyncStorage.getItem('gateValue');
      if (value !== null) {
        setGateValue(value);
      }
    } catch (error) {
      console.log('Error retrieving gate value: ', error);
    }
  };

  const handleModalToggle = () => {
    setModalGateVisible(!isModalGateVisible);
    setTempGateValue(gateValue);
  };

  const handleSaveGateValue = async () => {
    try {
      if (tempGateValue) {
        setShowWarning(false);
        await AsyncStorage.setItem('gateValue', tempGateValue);
        setGateValue(tempGateValue);
        handleModalToggle();
      } else {
        setShowWarning(true);
      }
    } catch (error) {
      console.log('Error saving gate value: ', error);
    }
  };

  const handleLogout = () => {
    // Show the confirmation modal
    setModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    // Perform logout actions
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('browseSession');
      setModalVisible(false);
      // navigation.navigate('Login');
      resetStack('Login');
    } catch (error) {
      console.error('Error deleting data from AsyncStorage:', error);
    }
  };

  const resetStack = (routeName) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  };

  const handleCancelLogout = () => {
    // Cancel logout
    setModalVisible(false);
  };


  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logo} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.heading}>Scanner Porporasi</Text>
        {roleCode !== 'admin' && (
          <Text style={styles.heading2}>Gate : {gateValue}</Text>
        )}
      </View>
      {roleCode !== 'admin' && (
        <View style={styles.gate}>
          <Button title="Pilih Gate" style={styles.gate} onPress={handleModalToggle} />
        </View>
      )}
      <Button title="Logout" color="#E11900" onPress={handleLogout} />
      <Text style={styles.text}>Version : 1.0.0 </Text>

      <ConfirmationModal
        visible={modalVisible} 
        title="Apakah kamu yakin mau keluar?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      <Modal visible={isModalGateVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.messageText}>
              <Text style={styles.message}>Masukkan nama gate</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama gate"
              value={tempGateValue}
              onChangeText={(text) => setTempGateValue(text)}
            />
            {showWarning && <Text style={styles.warning}>*Gate wajib diisi</Text>}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonyes} onPress={handleSaveGateValue}>
                <Text style={styles.buttonText}>Simpan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonno} onPress={handleModalToggle}>
                <Text style={styles.buttonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 16,
    justifyContent: 'center',
    color: '#fff',
    backgroundColor: '#051954',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    width: 250,
  },
  warning: {
    color: 'red',
    marginTop: -20,
    marginBottom: 20,
    fontSize: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  gate: {
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 150,
  },
  headingContainer: {
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
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
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontWeight: 'bold',
    fontSize: 18,
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

export default LogoutScreen;