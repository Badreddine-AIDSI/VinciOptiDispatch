// import React, { useRef, useState } from 'react';
// import { View, StyleSheet, Text } from 'react-native';
// import MapView, { UrlTile } from 'react-native-maps';

// // Import components and services
// import { InfoPanel } from '../components/InfoPanel';
// import { TechnicianMarker } from '../components/TechnicianMarker';
// import { useWebSocketService } from '../services/WebSocketService';
// import { colors, commonStyles } from '../styles/common';

// // Constants
// const WS_URL = 'ws://10.171.35.91:8000/ws/technician/';
// const INITIAL_REGION = {
//   latitude: 33.574593,
//   longitude: -7.582493,
//   latitudeDelta: 0.1,
//   longitudeDelta: 0.1,
// };

// export default function HomeScreen() {
//   // State and refs
//   const [technician, setTechnician] = useState(null);
//   const mapRef = useRef(null);

//   // Safe coordinate parsing helper
//   const parseCoordinate = (value) => {
//     const num = parseFloat(value);
//     return isNaN(num) ? 0 : num;
//   };

//   // Handle receiving WebSocket messages
//   const handleMessageReceived = (data) => {
//     // Validate received data
//     if(data.latitude && data.longitude && data.name) {
//       setTechnician(data);
      
//       // Update map view
//       if (mapRef.current) {
//         mapRef.current.animateToRegion({
//           latitude: parseCoordinate(data.latitude),
//           longitude: parseCoordinate(data.longitude),
//           latitudeDelta: 0.02,
//           longitudeDelta: 0.02,
//         });
//       }
//     }
//   };

//   // Initialize WebSocket service
//   const { connected } = useWebSocketService(WS_URL, handleMessageReceived);

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Technician Tracker</Text>
//         <View style={[
//           styles.statusIndicator, 
//           { backgroundColor: connected ? colors.success : colors.error }
//         ]} />
//       </View>

//       {/* Map */}
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={INITIAL_REGION}
//       >
//         <UrlTile
//           urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
//           maximumZ={19}
//           detectRetina={true}
//         />
        
//         <TechnicianMarker 
//           technician={technician} 
//           parseCoordinate={parseCoordinate}
//         />
//       </MapView>

//       {/* Information Panel */}
//       <InfoPanel 
//         technician={technician}
//         parseCoordinate={parseCoordinate}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: commonStyles.container,
//   header: commonStyles.header,
//   headerText: commonStyles.headerText,
//   statusIndicator: {
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//   },
//   map: {
//     flex: 1,
//   },
// });

import * as React from 'react';
import { View, Text } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={() => navigation.navigate('Home')}
                style={{ fontSize: 26, fontWeight: 'bold' }}>Details Screen</Text>
        </View>
    );
}