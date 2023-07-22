import React, { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import {Picker} from '@react-native-picker/picker';
import ConfirmationModal from '../../components/ConfirmationModal';
import AlertBar from '../../components/AlertBar';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

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
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      // setAccessToken(storedAccessToken);
      if (!storedAccessToken) {
        // Redirect to login
        navigation.navigate('Login');
      } else {
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
          setSelectedEvent(dataTickets.eventId);
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
      const total = dataTickets.listTicket.length;
      const upload = dataTickets.listTicket.reduce((accumulator, ticket) => {
        if (ticket.count > 0) {
          return accumulator + 1;
        }
        return accumulator;
      }, 0);
      const scanned = await AsyncStorage.getItem('scannedTickets');
      const scannedTickets = JSON.parse(scanned);
      let scannedTicketsCount = 0;
      if (scannedTickets) {
        scannedTicketsCount = scannedTickets.length;
      }
      setEventName(dataTickets.eventName || '-');
      setTotalTickets(parseInt(total) || 0);
      setUploadedTickets(parseInt(upload) || 0);
      setScannedTickets(scannedTicketsCount);
    } catch (error) {
      console.log('Error fetching tickets from local storage:', error);
    }
  };

  const handleSyncTickets = () => {
    api.get('/event/getbyid/' + selectedEvent)
      .then((response) => {
        const data = JSON.stringify(response.data.data);
        const dataJson = response.data.data
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
    fetchTicketsFromLocalStorage();
  };
  
  const handleUploadTickets = async () => {
    try {
      const storedDataScanned = await AsyncStorage.getItem('scannedTickets');
      const dataScanned = JSON.parse(storedDataScanned);
      console.log('storedDataScanned:', storedDataScanned);
      // Upload the scanned tickets to the API
      api.post('/send/dataticket', dataScanned)
        .then((data) => {
          console.log('Scanned tickets uploaded successfully:', data);
          triggerNotification('success', 'Data berhasil di upload')
        })
        .catch((error) => {
          console.log('Error uploading scanned tickets:', error);
        });
    } catch (error) {
      console.log('Error get dataScanned from AsyncStorage:', error);
    }
  };

  const saveImageToLocal = async (imageUrl, name) => {
    try {
      const imagePath = `${FileSystem.documentDirectory}${name}.jpeg`; // Change the file name and extension as needed
  
      const { uri } = await FileSystem.downloadAsync(imageUrl, imagePath);
      let storeKey = name+'Uri'
      AsyncStorage.setItem(storeKey, uri)
        .then(() => {
          console.log('Save image to local successfully:', storeKey,':', uri);
        })
        .catch((error) => {
          console.log('Error save image to local:', error);
        });
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
        Hi, Admin
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
    marginVertical: 10,
    paddingVertical: 10,
    height: 45,
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
