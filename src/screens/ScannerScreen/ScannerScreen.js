import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import * as FileSystem from 'expo-file-system';
import AlertScanBar from '../../components/AlertScanBar';

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
  const [dataTickets, setDataTickets] = useState([]);
  const navigation = useNavigation();
  const ticketCodeRef = useRef(null);

  
  useEffect(() => {
    ticketCodeRef.current.focus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const checkAccessToken = async () => {
        try {
          const storedAccessToken = await AsyncStorage.getItem('accessToken');
          // setAccessToken(storedAccessToken);
          if (!storedAccessToken) {
            // Redirect to login
            navigation.navigate('Login');
          } else {
            readDataAndDataScanned();
            ticketCodeRef.current.focus();
          }
        } catch (error) {
          console.error('Error retrieving accessToken from AsyncStorage:', error);
        }
      };
  
      checkAccessToken();
      return () => {
        isMounted = false;
      }
    }, [])
  );

  const showAlert = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const readDataAndDataScanned = async () => {
    try {
      const headerUri = await AsyncStorage.getItem('headerUri');
      const footerUri = await AsyncStorage.getItem('footerUri');
      if (headerUri && footerUri) {
        setHeaderImage(headerUri);
        setFooterImage(footerUri);
      }
      const dataTickets = await AsyncStorage.getItem('dataTickets');
      const filePath = FileSystem.documentDirectory + 'tickets.json';
      const storedData = await FileSystem.readAsStringAsync(filePath);
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

      if (storedData && dataTickets) {
        let storedData2 = JSON.parse(storedData);
        setListTicket(storedData2);
        let dataTickets2 = JSON.parse(dataTickets);
        setDataTickets(dataTickets2);
      } else {
        setListTicket([]);
        setDataTickets([]);
      }

      const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
      FileSystem.readAsStringAsync(filePathScan)
      .then((json) => {
        let storedData2 = JSON.parse(storedData);
        let dataScan = JSON.parse(json);
        setDataScanned(dataScan);
        setTotalDataScanned(dataScan.length);

        let missingTicketCodeCount = dataScan.filter(
          scannedObj => !storedData2.some(dataObj => dataObj.ticketCode === scannedObj.ticketCode)
        ).length;
        setTotalNotValid(missingTicketCodeCount);
      })
      .catch((error) => {
        console.error('Error while reading JSON data:', error);
        setDataScanned([]);
        setTotalDataScanned(0);
        setTotalNotValid(0);
      });
    } catch (error) {
      console.log('Error reading data and dataScanned from AsyncStorage:', error);
    }
  };

  const saveDataScanned = async (newDataScanned) => {
    try {
      if (newDataScanned) {
        const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
        await FileSystem.writeAsStringAsync(filePathScan, JSON.stringify(newDataScanned));
        await AsyncStorage.setItem('scannedTickets', JSON.stringify(newDataScanned.length));
        setDataScanned(newDataScanned);
        setTotalDataScanned(newDataScanned.length);
        setTicketCode('');
        ticketCodeRef.current.focus();
      }
    } catch (error) {
      console.log('Error saving dataScanned to AsyncStorage:', error);
    }
  };

  const handleTicketCodeChange = (value) => {
    setTicketCode(value);
    clearTimeout(timerId);

    const newTimerId = setTimeout(() => {
      const ticket = listTicket.find((ticket) => ticket.ticketCode === value);
      const formattedDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      console.log('formattedDateTime: ', formattedDateTime);
      setCheckInTime(formattedDateTime);

      if (ticket) {
        const ticketIndex = dataScanned.findIndex((ticketObj) => ticketObj.ticketCode === value);
        
        const updatedTicket = {
          count: ticket.count + 1,
          ticketCode: value,
          eventClassId: ticket.eventClassId,
          checkInTime: formattedDateTime,
          status: ticket.count === 0 ? 'success' : 'duplicate',
          eventId: dataTickets.eventId,
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
            eventId: dataTickets.eventId,
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
        ref={ticketCodeRef}
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
      <AlertScanBar
        visible={isVisible} 
        message={notificationMessage}
        type={notificationType}
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
