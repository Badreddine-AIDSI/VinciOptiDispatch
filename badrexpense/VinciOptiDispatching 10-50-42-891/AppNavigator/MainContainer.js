import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from '../app/screens/HomeScreen';
import DetailsScreen from '../app/screens/DetailsScreen';
import SettingsScreen from '../app/screens/SettingsScreen';
import MapScreen from '../app/screens/MapScreen';  // Import the MapScreen
import TechnicianScreen from '../app/screens/TechnicianScreen';  // Import the TechnicianScreen

// Screen names
const homeName = "Home";
const detailsName = "Details";
const settingsName = "Settings";
const mapName = "Map";  // Add map name constant

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <Tab.Navigator
      initialRouteName={homeName}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let rn = route.name;

          if (rn === homeName) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (rn === detailsName) {
            iconName = focused ? 'list' : 'list-outline';
          } else if (rn === settingsName) {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (rn === mapName) {
            iconName = focused ? 'map' : 'map-outline';  // Add map icon
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'grey',
        tabBarLabelStyle: { paddingBottom: 10, fontSize: 10 },
        tabBarStyle: { padding: 10, height: 70 }
      })}
    >
      <Tab.Screen name={homeName} component={HomeScreen} />
      <Tab.Screen
                  name={mapName}
                  component={MapScreen}
                  // options={{
                  //   title: 'd', // Sets header title
                  //   headerStyle: {
                  //     backgroundColor: '#007AFF', // Your header color
                  //   },
                  //   headerTintColor: '#fff', // Color of title and back button
                  //   headerTitleStyle: {
                  //     fontWeight: 'bold',
                  //   },
                  //   // You might need extra logic to show the connection status indicator here
                  // }}
                />
      <Tab.Screen name={detailsName} component={TechnicianScreen} />
      <Tab.Screen name={settingsName} component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default MainContainer;