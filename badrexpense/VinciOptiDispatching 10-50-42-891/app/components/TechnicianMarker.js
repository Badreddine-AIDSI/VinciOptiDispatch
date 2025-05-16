import React, { useEffect, memo } from 'react';
import { Marker } from 'react-native-maps';
import { View } from 'react-native';

export const TechnicianMarker = memo(({ technician, parseCoordinate }) => {
  // Log when marker renders with new coordinates for debugging
  useEffect(() => {
    console.log('TechnicianMarker rendering at:', 
      parseCoordinate(technician?.latitude), 
      parseCoordinate(technician?.longitude));
  }, [technician]);
  
  if (!technician) {
    console.log('No technician data provided to marker');
    return null;
  }
  
  // Extract and ensure coordinates are valid numbers
  const lat = parseFloat(parseCoordinate(technician.latitude));
  const lng = parseFloat(parseCoordinate(technician.longitude));
  
  // Verify coordinates are valid before rendering marker
  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) < 0.000001 || Math.abs(lng) < 0.000001) {
    console.warn('Invalid coordinates for TechnicianMarker:', lat, lng);
    return null;
  }
  
  return (
    <Marker
      // Use a unique key to force re-rendering on position updates
      key={`tech-${technician._timestamp || Date.now()}`}
      coordinate={{
        latitude: lat,
        longitude: lng
      }}
      title={technician.name || 'Technician'}
      description={technician.status || 'Status unknown'}
    >
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF0000',
        borderWidth: 2,
        borderColor: 'white'
      }} />
    </Marker>
  );
});