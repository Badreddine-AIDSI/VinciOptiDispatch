import { Platform, PermissionsAndroid } from 'react-native';
import { WS_URL } from '../config/constants';
import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.watchId = null;
    this.technicianId = null;
    this.socket = null;
    this.connectionListeners = [];
    this.isConnected = false;
  }

  async initialize(technicianId) {
    this.technicianId = technicianId;
    
    try {
      // Request permissions first
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return false;
      }
      
      console.log('Location permissions granted');
      
      // Connect to WebSocket now that we have permissions
      this.connectWebSocket();
      
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking() {
    if (!this.technicianId) {
      console.error('Cannot start tracking: Technician ID not set');
      return false;
    }

    try {
      // Start watching position using Expo Location
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 5,
        },
        (position) => {
          this.sendLocationUpdate(position.coords);
        }
      );
      
      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async getCurrentLocation() {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      return position.coords;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async sendCurrentLocation() {
    try {
      const position = await this.getCurrentLocation();
      
      if (!position) {
        console.error('Could not get current position');
        return false;
      }
      
      this.sendLocationUpdate(position);
      return true;
    } catch (error) {
      console.error('Failed to send current location:', error);
      return false;
    }
  }

  sendLocationUpdate(coords) {
    try {
      if (!this.socket || !this.technicianId) {
        console.log('WebSocket not initialized or no technician ID');
        return;
      }
      
      // Only send if socket is connected
      if (this.socket.readyState === WebSocket.OPEN) {
        // Create message using the format expected by your Django consumer
        const message = JSON.stringify({
          type: 'location_update',
          id: this.technicianId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        
        // Send to server
        this.socket.send(message);
        console.log('Current location sent:', coords);
      } else {
        console.log('WebSocket not connected, reconnecting...');
        this.connectWebSocket();
      }
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  stopTracking() {
    if (this.watchId) {
      if (typeof this.watchId.remove === 'function') {
        this.watchId.remove();
      } else {
        Location.removeWatchAsync(this.watchId);
      }
      this.watchId = null;
      console.log('Location tracking stopped');
    }
    
    // Close WebSocket when stopping tracking
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  addConnectionListener(listener) {
    if (typeof listener === 'function') {
      this.connectionListeners.push(listener);
      // Immediately notify of current state
      listener(this.isConnected);
    }
  }

  removeConnectionListener(listener) {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }
  
  notifyConnectionListeners(connected) {
    this.isConnected = connected;
    this.connectionListeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(connected);
      }
    });
  }

  connectWebSocket() {
    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }
      
      if (!this.technicianId) {
        console.error('Cannot connect: No technician ID set');
        return false;
      }
      
      const url = `${WS_URL}`;
      console.log(`Connecting to WebSocket: ${url}`);
      
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.notifyConnectionListeners(true);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyConnectionListeners(false);
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionListeners(false);
      };
      
      this.socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
      };
      
      return true;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.notifyConnectionListeners(false);
      return false;
    }
  }
}

export default new LocationService();

