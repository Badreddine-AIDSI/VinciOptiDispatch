// import React, { useEffect } from 'react';
// import { View, Text, Button } from 'react-native';
// import LocationService from '../services/LocationService';

// export default function MainScreen() {
//   useEffect(() => {
//     // Initialize location tracking when component mounts
//     const startTracking = async () => {
//       // Replace '1' with the actual technician ID
//       const initialized = await LocationService.initialize('1');
//       if (!initialized) {
//         alert('Unable to initialize location tracking');
//       }
//     };
    
//     startTracking();
    
//     // Clean up when component unmounts
//     return () => {
//       LocationService.stopTracking();
//     };
//   }, []);

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Tracking Active</Text>
//       <Text>Your location is being shared with dispatchers</Text>
//     </View>
//   );
// }