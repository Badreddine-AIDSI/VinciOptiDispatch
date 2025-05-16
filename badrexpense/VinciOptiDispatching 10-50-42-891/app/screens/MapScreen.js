import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Platform,
  Animated,
  Easing
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import { TechnicianMarker } from '../components/TechnicianMarker';
import { useWebSocketService } from '../services/WebSocketService';
import { colors, commonStyles } from '../styles/common';
import { parseCoordinate } from '../utils/helpers';
import { getDirections } from '../services/DirectionsService';
import LocationService from '../services/LocationServices';

// Constants
const WS_URL = 'ws://10.171.38.27:8000/ws/technician/';

// Modern styled action button component
const ActionButton = ({ onPress, icon, active, style, label }) => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View 
        style={[
          styles.actionButton,
          active && styles.actionButtonActive,
          { transform: [{ scale: buttonScale }] },
          style
        ]}
      >
        <Text style={[styles.actionButtonIcon, active && styles.actionButtonIconActive]}>
          {icon}
        </Text>
        {label && (
          <Text style={[styles.actionButtonLabel, active && styles.actionButtonLabelActive]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function MapScreen() {
  // State and refs
  const [technician, setTechnician] = useState(null);
  const [trackHistory, setTrackHistory] = useState([]);
  const [destination, setDestination] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [locationServiceConnected, setLocationServiceConnected] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [showTrackHistory, setShowTrackHistory] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const mapRef = useRef(null);
  const lastKnownPosition = useRef(null);
  const debugPanelOpacity = useRef(new Animated.Value(0)).current;

  // Initialize location service with proper error handling
  useEffect(() => {
    const initializeLocationService = async () => {
      const techId = '5'; // Replace with actual technician ID
      try {
        console.log('Initializing LocationService...');
        const result = await LocationService.initialize(techId);
        if (result) {
          console.log('LocationService initialized successfully');
          setLocationServiceConnected(true);
          
          // Start tracking location
          const trackingStarted = await LocationService.startTracking();
          if (!trackingStarted) {
            Alert.alert('Warning', 'Location tracking could not be started. Some features may not work properly.');
          }
        } else {
          console.error('Failed to initialize LocationService');
          setLocationServiceConnected(false);
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to track technicians. Please enable location services.',
            [
              { text: 'OK', onPress: () => console.log('OK Pressed') }
            ]
          );
        }
      } catch (error) {
        console.error('Error initializing LocationService:', error);
        setLocationServiceConnected(false);
      }
    };

    initializeLocationService();

    // Cleanup on unmount
    return () => {
      LocationService.stopTracking();
      console.log('LocationService stopped');
    };
  }, []);

  // Animate debug panel visibility
  useEffect(() => {
    Animated.timing(debugPanelOpacity, {
      toValue: showDebug ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  }, [showDebug]);

  // Handle receiving WebSocket messages
  const handleMessageReceived = (data) => {
    console.log('Processing WebSocket data:', data);
    
    // Skip if not a location update
    if (data.type !== 'location_update') {
      console.log('Ignoring non-location message:', data.type);
      return;
    }
    
    try {
      // Make sure we have valid coordinate data
      const lat = parseFloat(typeof data.latitude === 'string' ? 
        parseCoordinate(data.latitude) : data.latitude);
      const lng = parseFloat(typeof data.longitude === 'string' ? 
        parseCoordinate(data.longitude) : data.longitude);
      
      console.log('Parsed coordinates:', lat, lng);
      
      // Better validation - check specifically for NaN but allow zero values
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates received:', data);
        return;
      }
      
      // Create a completely new object to trigger state update
      const newTechnician = {
        id: data.id || 'unknown',
        name: data.name || 'Unknown Technician',
        status: data.status || 'unknown',
        latitude: lat,
        longitude: lng,
        timestamp: data.timestamp || new Date().toISOString(),
        _timestamp: Date.now() // Force re-render
      };
      
      console.log('Setting technician state with:', newTechnician);
      
      // Update state with the new technician data
      setTechnician(newTechnician);
      lastKnownPosition.current = { latitude: lat, longitude: lng };
      
      // Update track history with the new position, only if there's a significant movement
      const lastPosition = trackHistory.length > 0 ? trackHistory[trackHistory.length - 1] : null;
      
      // Only add to history if it's a significant movement (more than ~5 meters)
      if (!lastPosition || 
          calculateDistance(lastPosition.latitude, lastPosition.longitude, lat, lng) > 0.005) {
        setTrackHistory(prev => [
          ...prev, 
          { latitude: lat, longitude: lng, timestamp: data.timestamp }
        ].slice(-50)); // Keep last 50 positions instead of 20
      }
      
      // Animate map to follow technician if follow mode is on
      if (followMode && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  };

  // Calculate distance between two coordinates in kilometers (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Use the WebSocket service
  const { connected: wsConn } = useWebSocketService(WS_URL, handleMessageReceived);
  
  // Update WebSocket connection status
  useEffect(() => {
    setWsConnected(wsConn);
  }, [wsConn]);

  // Manual refresh button to force location update
  const handleRefreshLocation = async () => {
    try {
      console.log('Manually requesting current location');
      const success = await LocationService.sendCurrentLocation();
      if (success) {
        console.log('Manual location update sent successfully');
      } else {
        console.warn('Failed to send manual location update');
        Alert.alert('Update Failed', 'Could not update location. Please check connection.');
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
    }
  };

  // Handle centering the map on the technician
  const handleCenterMap = () => {
    if (!technician && !lastKnownPosition.current) {
      Alert.alert('No Location', 'No technician location available to center the map.');
      return;
    }
    
    const position = technician || { latitude: lastKnownPosition.current.latitude, longitude: lastKnownPosition.current.longitude };
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      
      // Turn on follow mode
      setFollowMode(true);
    }
  };

  // Toggle track history visibility
  const toggleTrackHistory = () => {
    setShowTrackHistory(!showTrackHistory);
  };

  // Handle map drag to disable follow mode
  const handleMapDrag = () => {
    setFollowMode(false);
  };

  // Toggle debug info panel
  const toggleDebugInfo = () => {
    setShowDebug(!showDebug);
  };

  // Determine overall connection status
  const connectedStatus = wsConnected && locationServiceConnected;

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerText}>Technician Tracker</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {connectedStatus ? 'Connected' : 'Disconnected'}
          </Text>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: connectedStatus ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
      </View> */}

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        onPanDrag={handleMapDrag}
        onRegionChangeComplete={handleMapDrag}
        mapType="standard"
      >
        {technician && (
          <TechnicianMarker 
            key={`tech-${technician._timestamp || 'initial'}`}
            technician={technician} 
            parseCoordinate={parseCoordinate}
          />
        )}

        {showTrackHistory && trackHistory.length > 1 && (
          <Polyline
            coordinates={trackHistory}
            strokeColor="rgba(65, 105, 225, 0.8)"
            strokeWidth={4}
            lineDashPattern={[0]}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination}
            pinColor="green"
          />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="rgba(255, 45, 85, 0.8)"
            strokeWidth={5}
            lineDashPattern={[1]}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Location info card */}
      {technician && (
        <View style={styles.locationCard}>
          <View style={styles.locationCardRow}>
            <Text style={styles.locationCardLabel}>Tech ID:</Text>
            <Text style={styles.locationCardValue}>{technician.id}</Text>
          </View>
          <View style={styles.locationCardRow}>
            <Text style={styles.locationCardLabel}>Status:</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{technician.status}</Text>
            </View>
          </View>
          <View style={styles.locationCardRow}>
            <Text style={styles.locationCardLabel}>Updated:</Text>
            <Text style={styles.locationCardValue}>
              {new Date(technician._timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {/* Debug Info - Animated */}
      <Animated.View 
        style={[
          styles.debugBox,
          { 
            opacity: debugPanelOpacity,
            transform: [{ 
              translateY: debugPanelOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
        pointerEvents={showDebug ? 'auto' : 'none'}
      >
        <Text style={styles.debugTitle}>Debug Information</Text>
        {technician ? (
          <>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Latitude:</Text>
              <Text style={styles.debugValue}>{technician.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Longitude:</Text>
              <Text style={styles.debugValue}>{technician.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Last update:</Text>
              <Text style={styles.debugValue}>
                {new Date(technician._timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Mode:</Text>
              <Text style={styles.debugValue}>{followMode ? 'Following' : 'Manual'}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.debugText}>No location data available</Text>
        )}
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>WebSocket:</Text>
          <Text style={[
            styles.debugValue, 
            { color: wsConnected ? '#4CAF50' : '#F44336' }
          ]}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Location Service:</Text>
          <Text style={[
            styles.debugValue, 
            { color: locationServiceConnected ? '#4CAF50' : '#F44336' }
          ]}>
            {locationServiceConnected ? 'Ready' : 'Not Ready'}
          </Text>
        </View>
      </Animated.View>

      {/* Action Buttons - Right Side */}
      <View style={styles.actionButtonContainer}>
        <ActionButton
          icon="🛤️"
          active={showTrackHistory}
          onPress={toggleTrackHistory}
          label="History"
        />
        
        <ActionButton
          icon="👁️"
          active={followMode}
          onPress={() => setFollowMode(!followMode)}
          label="Follow"
        />

        <ActionButton
          icon="📍"
          onPress={handleCenterMap}
          label="Center"
        />

        <ActionButton
          icon="↻"
          onPress={handleRefreshLocation}
          label="Refresh"
        />
        
        <ActionButton
          icon="⚙️"
          active={showDebug}
          onPress={toggleDebugInfo}
          label="Debug"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: Platform.OS === 'ios' ? 48 : 42,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    marginRight: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0,
  },
  map: {
    flex: 1,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 0,
    minWidth: 100,
  },
  actionButtonActive: {
    backgroundColor: '#3B82F6',
  },
  actionButtonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  actionButtonIconActive: {
    color: 'white',
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionButtonLabelActive: {
    color: 'white',
  },
  debugBox: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 90,
    left: 16,
    backgroundColor: 'rgba(33, 33, 33, 0.85)',
    padding: 12,
    borderRadius: 12,
    width: 220,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  debugTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 4,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  debugLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  debugValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  locationCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 90,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  locationCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationCardLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  locationCardValue: {
    fontSize: 12,
    color: '#222',
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '600',
  },
});