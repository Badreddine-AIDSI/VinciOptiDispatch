import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location'; // Using Expo Location or you can import { Geolocation } from 'react-native-geolocation-service';
import LocationService from '../services/LocationServices';

const TechnicianScreen = ({ route, navigation }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const technicianId = route.params?.technicianId || '5'; // Default ID if not provided
  
  // Request location permissions when component mounts
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Location permission is required for this feature.',
            [{ text: 'OK' }]
          );
          return;
        }
        setLocationPermission(true);
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    })();

    // Monitor WebSocket connection status
    const handleConnectionChange = (connected) => {
      setIsConnected(connected);
    };
    
    LocationService.addConnectionListener(handleConnectionChange);
    
    // Clean up when component unmounts
    return () => {
      LocationService.removeConnectionListener(handleConnectionChange);
      if (isTracking) {
        LocationService.stopTracking();
      }
    };
  }, []);
  
  const startLocationTracking = async () => {
    if (!locationPermission) {
      Alert.alert('Permission Required', 'Location permission is needed to track your position.');
      return;
    }

    try {
      const success = await LocationService.initialize(technicianId);
      if (success) {
        setIsTracking(true);
      } else {
        Alert.alert('Error', 'Failed to initialize location tracking');
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking: ' + error.message);
    }
  };
  
  const stopLocationTracking = () => {
    try {
      LocationService.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const sendTestLocation = () => {
    if (!isConnected) {
      Alert.alert('WebSocket Error', 'WebSocket is not connected. Reconnecting...');
      LocationService.connectWebSocket();
      return;
    }

    if (LocationService.socket && LocationService.socket.readyState === 1) { // WebSocket.OPEN is 1
      LocationService.socket.send(JSON.stringify({
        type: 'location_update',
        id: technicianId,
        latitude: 37.7749,
        longitude: -122.4194
      }));
      console.log('Test location sent');
    } else {
      console.log('WebSocket not connected');
      Alert.alert('WebSocket Error', 'WebSocket is not connected');
    }
  };

  const sendCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert('Permission Required', 'Location permission is needed to track your position.');
      return;
    }

    if (!isConnected) {
      Alert.alert('WebSocket Error', 'WebSocket is not connected. Reconnecting...');
      LocationService.connectWebSocket();
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const { latitude, longitude } = location.coords;
      console.log(`Current position: ${latitude}, ${longitude}`);
      
      // Send directly via WebSocket
      if (LocationService.socket && LocationService.socket.readyState === 1) { // WebSocket.OPEN is 1
        LocationService.socket.send(JSON.stringify({
          type: 'location_update',
          id: technicianId,
          latitude: latitude,
          longitude: longitude,
        }));
        console.log(`Current location sent: ${latitude}, ${longitude}`);
      } else {
        Alert.alert('WebSocket Error', 'WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      Alert.alert('Location Error', `Failed to get current location: ${error.message}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Technician Tracking</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
        </Text>
        <Text style={styles.statusText}>
          Location Permission: {locationPermission ? 'Granted' : 'Not Granted'}
        </Text>
      </View>
      
      {!isTracking ? (
        <Button 
          title="Start Tracking" 
          onPress={startLocationTracking} 
          disabled={!locationPermission}
        />
      ) : (
        <Button 
          title="Stop Tracking" 
          onPress={stopLocationTracking} 
          color="red"
        />
      )}
      
      {isTracking && (
        <Text style={styles.infoText}>
          Your location is being shared with dispatchers in real-time
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title="Send Test Location" 
          onPress={sendTestLocation} 
        />

        <Button 
          title="SEND CURRENT LOCATION" 
          onPress={sendCurrentLocation}
          disabled={!locationPermission}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statusContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    marginBottom: 5,
  },
  infoText: {
    marginTop: 20,
    color: 'gray',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  }
});

export default TechnicianScreen;