import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet } from 'react-native';
import Logo from '../../../assets/logo.png';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/FontAwesome';
import AlertBar from '../../components/AlertBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import checkInternetConnection from '../../components/checkInternetConnection';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleLogin = async () => {
    try {
      let data = {
        "userLoginId": email,
        "password": password
      }
      // Check internet connection
      checkInternetConnection();
      // Send login request
      const response = await api.post('/access/login', data);
      // // Get the access token from the response
      if (response.data.data.token) {
        
        const accessToken = response.data.data.token;
        const browseSession = JSON.stringify(response.data.data.browseSession);
        
        // // Save the access token to AsyncStorage
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('browseSession', browseSession);
        
        setEmail('');
        setPassword('');
        // Redirect or navigate to the next screen
        // navigation.navigate('MainNavigator');
        
        resetStack('MainNavigator');
      
      } else {
        let message = response.data.data.message;
        triggerNotification('failed', message)
      }
    } catch (error) {
      console.log('Login error:', error);
    }
  };
  
  const resetStack = (routeName) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  };
  
  const triggerNotification = (type, message) => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    setNotificationType(type);
    setNotificationMessage(message);
  };
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logo} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.heading}>Scanner Proporsi</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#FFFFFF"
        onChangeText={text => setEmail(text)}
        value={email}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#FFFFFF"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Icon
          name={showPassword ? 'eye-slash' : 'eye'}
          size={20}
          color="#FFFFFF"
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        />
      </View>
      <Button title="Login" onPress={handleLogin} />
      
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#051954',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 150
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
  input: {
    height: 40,
    borderColor: 'gray',
    color: 'white',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingLeft: 8,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    color: 'white',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
});

export default LoginScreen;