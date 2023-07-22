import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen/LoginScreen';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainNavigator" component={MainNavigator} />
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Navigation;