import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Import your screens
import LoginScreen from '../app/screens/LoginScreen';
import MainContainer from './MainContainer';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Function to check auth state
  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setUserToken(token);
    } catch (e) {
      console.error('Failed to load token', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Add a listener for focus events to refresh auth state
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuthState();
    }, 1000); // Check every second during development
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {userToken == null ? (
        // Auth screens
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        // App screens
        <Stack.Screen 
          name="Main" 
          component={MainContainer} 
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}