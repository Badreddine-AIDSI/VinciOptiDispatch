import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  
  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout", 
          onPress: async () => {
            try {
              // Clear authentication data
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              
              // Navigate back to Login screen
              // This works because AppNavigator checks for token
              // and will show Login screen when token is null
              console.log('User logged out successfully');
              
              // We don't need to navigate manually - AppNavigator handles this
              // The interval in AppNavigator will detect missing token
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, value, onToggle) => {
    return (
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name={icon} size={24} color="#555" style={styles.settingIcon} />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        {typeof value === 'boolean' ? (
          <Switch value={value} onValueChange={onToggle} />
        ) : (
          <Text style={styles.settingValue}>{value}</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        {renderSettingItem('moon-outline', 'Dark Mode', darkMode, setDarkMode)}
        {renderSettingItem('notifications-outline', 'Notifications', notifications, setNotifications)}
        {renderSettingItem('language-outline', 'Language', 'English', null)}
        {renderSettingItem('information-circle-outline', 'App Version', '1.0.0', null)}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderSettingItem('person-outline', 'Edit Profile', '', () => navigation.navigate('EditProfile'))}
        {renderSettingItem('key-outline', 'Change Password', '', () => navigation.navigate('ChangePassword'))}
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>VinciOptiDispatching v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#888',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    color: '#888',
    fontSize: 14,
  }
});

export default SettingsScreen;