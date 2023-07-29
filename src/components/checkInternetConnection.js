import NetInfo from '@react-native-community/netinfo';

const checkInternetConnection = () => {
  NetInfo.fetch().then(state => {
    if (!state.isConnected) {
      alert('No Internet Connection');
    }
  });
};

export default checkInternetConnection;