import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, Image, Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import AlertScan from './../../components/AlertScan';

const ScannerScreen = () => {
  const [headerImage, setHeaderImage] = useState('');
  const [footerImage, setFooterImage] = useState('');
  const [gateValue, setGateValue] = useState('');
  const [user, setUser] = useState('');
  const [listTicket, setListTicket ] = useState([]);
  const [ticketCode, setTicketCode] = useState('');
  const [dataScanned, setDataScanned] = useState([]);
  const [totalDataScanned, setTotalDataScanned] = useState(0);
  const [totalDataNotValid, setTotalNotValid] = useState(0);
  const [checkInTime, setCheckInTime] = useState('');
  const [timerId, setTimerId] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // deleteAllData();
      const checkAccessToken = async () => {
        try {
          const storedAccessToken = await AsyncStorage.getItem('accessToken');
          // setAccessToken(storedAccessToken);
          if (!storedAccessToken) {
            // Redirect to login
            navigation.navigate('Login');
          } else {
            readDataAndDataScanned();
          }
        } catch (error) {
          console.error('Error retrieving accessToken from AsyncStorage:', error);
        }
      };
  
      checkAccessToken();
    }, [])
  );

  const deleteAllData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // await AsyncStorage.multiRemove(keys);
      await AsyncStorage.removeItem('scannedTickets');
      // console.log('All data deleted from AsyncStorage.');
      console.log('keys:', keys);
    } catch (error) {
      console.error('Error deleting data from AsyncStorage:', error);
    }
  };

  const showAlert = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setIsVisible(true);
  };

  const readDataAndDataScanned = async () => {
    try {
      const storedData = await AsyncStorage.getItem('dataTickets');
      const storedDataScanned = await AsyncStorage.getItem('scannedTickets');
      const gateValue = await AsyncStorage.getItem('gateValue');
      const browseSession = await AsyncStorage.getItem('browseSession');
      if (gateValue) {
        setGateValue(gateValue);
      } else {
        setModalVisible(true);
      }

      if (browseSession) {
        const browseSessionObj = JSON.parse(browseSession);
        setUser(browseSessionObj.userID);
      }

      if (storedData) {
        let dataTickets = JSON.parse(storedData);
        setListTicket(dataTickets);
      } else {
        setListTicket([]);
      }

      if (storedDataScanned) {
        let dataTickets = JSON.parse(storedData);
        let dataScan = JSON.parse(storedDataScanned);
        setDataScanned(dataScan);
        setTotalDataScanned(dataScan.length);

        let missingTicketCodeCount = dataScan.filter(
          scannedObj => !dataTickets.listTicket.some(dataObj => dataObj.ticketCode === scannedObj.ticketCode)
        ).length;
        setTotalNotValid(missingTicketCodeCount);
      } else {
        setDataScanned([]);
        setTotalDataScanned(0);
        setTotalNotValid(0);
      }
      const headerUri = await AsyncStorage.getItem('headerUri');
      const footerUri = await AsyncStorage.getItem('footerUri');
      if (headerUri && footerUri) {
        setHeaderImage(headerUri);
        setFooterImage(footerUri);
      }
    } catch (error) {
      console.log('Error reading data and dataScanned from AsyncStorage:', error);
    }
  };

  const saveDataScanned = async (newDataScanned) => {
    try {
      if (newDataScanned) {
        await AsyncStorage.setItem('scannedTickets', JSON.stringify(newDataScanned));
        setDataScanned(newDataScanned);
        setTotalDataScanned(newDataScanned.length);
        setTicketCode('');
      }
    } catch (error) {
      console.log('Error saving dataScanned to AsyncStorage:', error);
    }
  };

  const handleTicketCodeChange = (value) => {
    setTicketCode(value);
    clearTimeout(timerId);

    const newTimerId = setTimeout(() => {
      const ticket = listTicket.listTicket.find((ticket) => ticket.ticketCode === value);
      const formattedDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      setCheckInTime(formattedDateTime);

      if (ticket) {
        const ticketIndex = dataScanned.findIndex((ticketObj) => ticketObj.ticketCode === value);
        
        const updatedTicket = {
          count: ticket.count + 1,
          ticketCode: value,
          eventClassId: ticket.eventClassId,
          checkInTime: formattedDateTime,
          status: ticket.count === 0 ? 'success' : 'duplicate',
          eventId: listTicket.eventId,
          gate: gateValue,
          user: user
        };

        if (ticketIndex === -1) {
          saveDataScanned([...dataScanned, updatedTicket]);
          showAlert('Tiket "'+value+'" berhasil dipindai', 'success');
        } else {
          const newDataScanned = [...dataScanned];
          newDataScanned[ticketIndex] = {
            ...newDataScanned[ticketIndex],
            status: 'duplicate',
            count: newDataScanned[ticketIndex].count + 1,
          };
          saveDataScanned(newDataScanned);
          showAlert('Tiket "'+value+'" duplikat', 'warning');
        }
      } else {
        const newDataScanned = [
          ...dataScanned,
          {
            count: 1,
            ticketCode: value,
            eventClassId: '',
            checkInTime: formattedDateTime,
            status: 'failed',
            eventId: listTicket.eventId,
            gate: gateValue,
            user: user
          },
        ];
        setTotalNotValid(totalDataNotValid + 1);
        showAlert('Tiket "'+value+'" tidak ditemukan', 'failed');
        saveDataScanned(newDataScanned);
      }
    }, 1000);

    setTimerId(newTimerId);
  };
  
  const handleSaveGateValue = async () => {
    try {
      if (gateValue) {
        await AsyncStorage.setItem('gateValue', gateValue);
        setModalVisible(false);
        setShowWarning(false);
      } else {
        setShowWarning(true);
      }
    } catch (error) {
      console.log('Error saving gate value: ', error);
    }
  };
  return (
    <View style={styles.container}>
      {headerImage !== '' ? (
        <Image
          source={{ uri: headerImage }}
          style={{ width: '100%', height: '35%', resizeMode: 'cover' }}
        />
      ) : (
        <View
          style={{
            backgroundColor: '#051954',
            width: '100%',
            height: '35%',
          }}
        />
      )}
      <Text style={{...styles.text, marginTop:20 }}>Check-in gate: {gateValue} </Text>
      <Text style={styles.text}>Total data: {totalDataScanned} <Text style={{...styles.text, color:'red'}}> ({totalDataNotValid} data not valid)</Text> </Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#fff', color: '#fff', padding: 5, marginHorizontal: 10, marginVertical: 10 }}
        value={ticketCode}
        onChangeText={handleTicketCodeChange}
        placeholder="Enter ticket code"
        placeholderTextColor="#fff"
      />
      <Text style={{...styles.text, marginBottom:20 }}>Check-in time: {checkInTime} </Text>
      {footerImage !== '' ? (
        <Image
          source={{ uri: footerImage }}
          style={{ width: '100%', height: '40%', resizeMode: 'cover' }}
        />
      ) : (
        <View
          style={{
            backgroundColor: '#051954',
            width: '100%',
            height: '40%',
          }}
        />
      )}
      <AlertScan
        visible={isVisible} 
        title={notificationMessage}
        type={notificationType}
        onConfirm={() => setIsVisible(false)}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Masukkan nama gate</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama gate"
              value={gateValue}
              onChangeText={(text) => setGateValue(text)}
            />
            {showWarning && <Text style={styles.warning}>*Gate wajib diisi</Text>}
            <Button title="Simpan Gate" onPress={handleSaveGateValue} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#051954',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000', 
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    width: 250,
  },
  warning: {
    color: 'red',
    marginTop: -20,
    marginBottom: 20,
    fontSize: 12,
  }
});

export default ScannerScreen;
