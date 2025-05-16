// AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { EventEmitter } from 'events';

// Create an event emitter
const authEvents = new EventEmitter();

// Configure API URL based on platform
const API_URL = Platform.OS === 'ios' 
  ? 'http://127.0.0.1:8000'    // iOS simulator
  : 'http://10.0.2.2:8000';    // Android emulator

class AuthService {
  // Login function
  async login(username, password) {
    try {
      // Updated URL pattern
      const loginUrl = `${API_URL}/auth/api/login/`;
      console.log(`Attempting login to: ${loginUrl}`);
      
      const response = await axios.post(loginUrl, 
        { username, password },
        { 
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Login response:', response.data);
      
      // Save token to AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: response.data.user_id,
          username: response.data.username,
          email: response.data.email
        }));
        
        // Emit auth changed event
        authEvents.emit('authChanged', true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response',
        request: error.request ? 'Request made but no response' : 'No request'
      });
      throw error;
    }
  }

  // Logout function
  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Store user data in AsyncStorage
  async setUser(user) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get user data from AsyncStorage
  async getUser() {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Store authentication token
  async setToken(token) {
    try {
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Get authentication token
  async getToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Clear all stored user data
  async clearUserData() {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Subscribe to auth changes
  onAuthStateChanged(callback) {
    authEvents.on('authChanged', callback);
    return () => authEvents.off('authChanged', callback);
  }
}

export default new AuthService();