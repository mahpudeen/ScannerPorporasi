import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import LogoutScreen from '../screens/LogoutScreen/LogoutScreen';
import ScannerScreen from '../screens/ScannerScreen/ScannerScreen';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const [roleCode, setRoleCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getBrowseSession();
      
      return () => {
        isActive = false;
        // Cleanup function to cancel any ongoing tasks or subscriptions
      };
    }, [])
  )

  const getBrowseSession = async () => {
    const browseSession = await AsyncStorage.getItem('browseSession');
    if (browseSession) {
      const { roleCode } = JSON.parse(browseSession);
      setRoleCode(roleCode);
    }
  }
  return (
    <Tab.Navigator>
      {roleCode === 'admin' ? (
      <Tab.Screen
        name="Beranda"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      ) : (
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="barcode" size={size} color={color} />
          ),
        }}
      />
      )}
      <Tab.Screen
        name="Pengaturan"
        component={LogoutScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="gear" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
