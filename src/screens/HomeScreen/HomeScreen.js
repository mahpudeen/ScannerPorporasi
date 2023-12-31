import React, { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import {Picker} from '@react-native-picker/picker';
import ConfirmationModal from '../../components/ConfirmationModal';
import AlertBar from '../../components/AlertBar';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import checkInternetConnection from '../../components/checkInternetConnection';

const Home = () => {
  const [uploadedTickets, setUploadedTickets] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [scannedTickets, setScannedTickets] = useState(0);
  const [eventData, setEventData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventName, setEventName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [username, setUsername] = useState('');
  const navigation = useNavigation();
  
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
  
      checkAccessToken();
      return () => {
        isMounted = false;
      };
    }, [])
  );
  
  const checkAccessToken = async () => {
    try {
      const response = await api.get(
        '/access/cek'
      );
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      // setAccessToken(storedAccessToken);
      if (!storedAccessToken || response.data.status == 'ERROR') {
        // Redirect to login
        navigation.navigate('Login');
      } else if (response.data.status == 'SUCCESS') {
        fetchEventData();
        fetchTicketsFromLocalStorage();
      }
    } catch (error) {
      console.error('Error retrieving accessToken from AsyncStorage:', error);
    }
  };

  
  const fetchEventData = async () => {
    try {
      const response = await api.get(
        '/global/listeventactive'
      );
      const data = response.data;
      setEventData(data);
      let dataTickets = await AsyncStorage.getItem('dataTickets');
      setTimeout(() => {
        if (dataTickets) {
          dataTickets = JSON.parse(dataTickets);
          const foundEvent = data.find(event => event.value === dataTickets.eventId);
          setSelectedEvent(foundEvent ? dataTickets.eventId : data[0].value);
        } else {
          setSelectedEvent(data[0].value);
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  // Fetch the total tickets and scanned tickets from local storage
  const fetchTicketsFromLocalStorage = async () => {
    try {
      let dataTickets = await AsyncStorage.getItem('dataTickets');
      dataTickets = JSON.parse(dataTickets);
      let eventName = '-';
      if (dataTickets.eventName) {
        eventName = dataTickets.eventName;
      }
      const total =  await AsyncStorage.getItem('totalTickets');
      const upload =  await AsyncStorage.getItem('uploadedTickets');
      const scanned = await AsyncStorage.getItem('scannedTickets');
      const browseSession = await AsyncStorage.getItem('browseSession');
      let username = JSON.parse(browseSession).userName;
      setUsername(username);
      setEventName(eventName);
      setTotalTickets(parseInt(total) || 0);
      setUploadedTickets(parseInt(upload) || 0);
      setScannedTickets(parseInt(scanned) || 0);
    } catch (error) {
      console.log('Error fetching tickets from local storage:', error);
    }
  };

  const handleSyncTickets = async () => {
    // Check internet connection
    checkInternetConnection();
    await AsyncStorage.removeItem('headerUri');
    await AsyncStorage.removeItem('footerUri');
    api.get('/event/getbyid/' + selectedEvent)
      .then(async (response) => {
        // const data = JSON.stringify(response.data.data);
        const listTicket = response.data.data.listTicket
        await AsyncStorage.setItem('totalTickets', JSON.stringify(listTicket.length));
        const json = JSON.stringify(listTicket);
        const filePath = FileSystem.documentDirectory + 'tickets.json';
        await FileSystem.writeAsStringAsync(filePath, json)
        const dataJson = response.data.data
        delete dataJson.listTicket
        const data = JSON.stringify(dataJson);
        if (dataJson.header && dataJson.footer) {
          saveImageToLocal(dataJson.header, 'header')
          saveImageToLocal(dataJson.footer, 'footer')
        }
        // Save the data to local storage
        AsyncStorage.setItem('dataTickets', data)
          .then(() => {
            console.log('Total tickets synced successfully.');
            fetchTicketsFromLocalStorage();
            handleCancelSync();
          })
          .catch((error) => {
            console.log('Error syncing total tickets:', error);
          });
      })
      .catch((error) => {
        console.log('Error fetching data from the API:', error);
        alert('Gagal Sync Tiket');
      });
  };

  const handleShowSyncTickets = () => {
    // Show the confirmation modal
    setModalVisible(true);
  };
  const handleCancelSync = () => {
    // Cancel logout
    setModalVisible(false);
  };

  const scannedTicketsEmpty = async () => { 
    await AsyncStorage.removeItem('scannedTickets');
    await AsyncStorage.removeItem('uploadedTickets');
    let newDataScanned = [];
    const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
    await FileSystem.writeAsStringAsync(filePathScan, JSON.stringify(newDataScanned));
    fetchTicketsFromLocalStorage();
  };
  
  const handleUploadTickets = async () => {
    try {
      const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
      const storedDataScanned = await FileSystem.readAsStringAsync(filePathScan);
      const dataScanned = JSON.parse(storedDataScanned);
      if (dataScanned.length > 0) {
        const filePathScanBackup = FileSystem.documentDirectory + 'scannedsBackups.json';
        await FileSystem.writeAsStringAsync(filePathScanBackup, storedDataScanned);
      }
      console.log('Data scanned:', filePathScanBackup);
      
      // Split the data into batches of 1000
      const batchSize = 1000;
      const batches = [];
      for (let i = 0; i < dataScanned.length; i += batchSize) {
          batches.push(dataScanned.slice(i, i + batchSize));
      }
      let sumUploaded = 0;
      let sumFailed = 0;
      // Check internet connection
      checkInternetConnection();

      const promises = batches.map(async (batch) => {
        try {
            const response = await api.post('/send/dataticket', batch);
            if (response.data.status === 'SUCCESS' && response.status === 200) {
              triggerNotification('success', batch.length + ' data berhasil diupload')
              sumUploaded += batch.length;
            } else {
              triggerNotification('failed', batch.length + ' data gagal diupload')
              sumFailed += batch.length;
            }
        } catch (error) {
            triggerNotification('failed', batch.length + ' data gagal diupload')
            sumFailed += batch.length;
            console.error('Error sending data:', error);
        }
      });

      await Promise.all(promises);

      if (sumFailed == 0) {
        triggerNotification('success', 'Semua '+ sumUploaded + ' data berhasil diupload')
        const upload =  await AsyncStorage.getItem('uploadedTickets');
        const scanned = await AsyncStorage.getItem('scannedTickets');
        let total = 0;
        if (isNaN(upload) || upload === null) {
          total = parseInt(scanned);
        } else if (isNaN(scanned) || scanned === null) {
          total = parseInt(upload);
        } else {
          total = parseInt(upload) + parseInt(scanned);
        }
        await AsyncStorage.setItem('uploadedTickets', total.toString());
        let newDataScanned = [];
        const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
        await FileSystem.writeAsStringAsync(filePathScan, JSON.stringify(newDataScanned));
        await AsyncStorage.removeItem('scannedTickets');
        fetchTicketsFromLocalStorage();
      } else {
        triggerNotification('failed', "Sejumlah "+sumFailed+' data gagal diupload')
      }
      // Upload the scanned tickets to the API
      // api.post('/send/dataticket', dataScanned)
      //   .then(async (data) => {
      //     if (data.data.status === 'SUCCESS' && data.status === 200) {
      //       triggerNotification('success', 'Data berhasil diupload')
      //       const upload =  await AsyncStorage.getItem('uploadedTickets');
      //       const scanned = await AsyncStorage.getItem('scannedTickets');
      //       let total = 0;
      //       if (isNaN(upload) || upload === null) {
      //         total = parseInt(scanned);
      //       } else if (isNaN(scanned) || scanned === null) {
      //         total = parseInt(upload);
      //       } else {
      //         total = parseInt(upload) + parseInt(scanned);
      //       }
      //       await AsyncStorage.setItem('uploadedTickets', total.toString());
      //       let newDataScanned = [];
      //       const filePathScan = FileSystem.documentDirectory + 'scanneds.json';
      //       await FileSystem.writeAsStringAsync(filePathScan, JSON.stringify(newDataScanned));
      //       await AsyncStorage.removeItem('scannedTickets');
      //       fetchTicketsFromLocalStorage();
      //     } else {
      //       triggerNotification('failed', 'Data gagal diupload')
      //     }
      //   })
      //   .catch((error) => {
      //     console.log('Error uploading scanned tickets:', error);
      //     alert('Gagal Upload Tiket');
      //   });
    } catch (error) {
      console.log('Error get dataScanned from AsyncStorage:', error);
    }
  };

  const saveImageToLocal = async (imageUrl, name) => {
    try {
      const timestamp = Date.now(); // Get the current timestamp
      const imagePath = `${FileSystem.documentDirectory}${name}${timestamp}.jpeg`;

      console.log('img:', imageUrl)
      
      const { uri } = await FileSystem.downloadAsync(imageUrl, imagePath);
      let storeKey = name + 'Uri';
    
      // Save the new URI to AsyncStorage
      await AsyncStorage.setItem(storeKey, uri);
      console.log('Saved image to local successfully:', storeKey, ':', uri);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const triggerNotification = (type, message) => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    setNotificationType(type);
    setNotificationMessage(message);
  };

  const handleEventChange = (event) => {
    setSelectedEvent(event);
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, textAlign: 'center', marginVertical: 20, color: '#fff' }}>
        Hi, {username}
      </Text>
      <Text style={{color:'#fff'}}>
        Pilih Event :
      </Text>
      <View style={styles.containerSelect}>
        <Picker
          selectedValue={selectedEvent}
          onValueChange={handleEventChange}
          dropdownIconColor={'#000'}
        >
          {eventData.map((event) => (
            <Picker.Item
              key={event.value}
              label={event.text}
              value={event.value}
            />
          ))}
        </Picker>
      </View>
      <Button
        title="Sync Ticket"
        onPress={handleShowSyncTickets}
        style={{ marginTop: 20 }}
      />
      <View style={styles.tableContainer}>
        <View style={styles.column}>
          <Text style={styles.tableHeader}>Nama Event:</Text>
          <Text style={styles.tableHeader}>Total Tiket:</Text>
          <Text style={styles.tableHeader}>Tiket Terupload:</Text>
          <Text style={styles.tableHeader}>Tiket Terscan:</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.tableData}>{eventName}</Text>
          <Text style={styles.tableData}>{totalTickets}</Text>
          <Text style={styles.tableData}>{uploadedTickets}</Text>
          <Text style={styles.tableData}>{scannedTickets}</Text>
        </View>
      </View>
      <Button
        title="Upload Ticket"
        onPress={handleUploadTickets}
        style={{ marginTop: 10 }}
      />
      <ConfirmationModal
        visible={modalVisible} 
        title="Sync Tiket dapat menghapus tiket yang sudah terscan. Yakin Sync Tiket?"
        onConfirm={() => {
          handleSyncTickets();
          scannedTicketsEmpty();
        }}
        onCancel={handleCancelSync}
      />
      <AlertBar
        type={notificationType}
        message={notificationMessage}
        visible={isVisible}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 16,
    backgroundColor: '#051954',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
  containerSelect: {
    backgroundColor: '#fff',
    marginVertical: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  column: {
    flex: 1,
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
    fontSize: 18,
  },
  tableData: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff',
    fontSize: 18,
  },
});

export default Home;
