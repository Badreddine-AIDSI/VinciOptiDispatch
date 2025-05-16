import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#2c3e50',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#f0f2f5',
  white: '#ffffff',
  textPrimary: '#333333',
  textSecondary: '#666666',
};

export const commonStyles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
});

export const animatedMarker = {
  pulse: {
    width: 20,
    height: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2563EB',
  }
};