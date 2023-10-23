import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create an instance of axios
const api = axios.create({
  baseURL: 'https://porporasi-surakarta.finnet.co.id/', // Replace with your API base URL
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get the access token from AsyncStorage
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    // Add the access token to the request headers
    if (accessToken) {
      config.headers['Access-Key'] = accessToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

