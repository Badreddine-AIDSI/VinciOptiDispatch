import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const InfoPanel = ({ technician, parseCoordinate, lastUpdate }) => {
  // Add state to track if panel is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Force expand when technician data changes
  useEffect(() => {
    if (technician) {
      setIsExpanded(true);
    }
  }, [technician?.latitude, technician?.longitude]);
  
  if (!technician) {
    return (
      <View style={styles.infoPanel}>
        <Text style={styles.loadingText}>Waiting for technician data...</Text>
      </View>
    );
  }

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    } catch (e) {
      return 'N/A';
    }
  };

  // Status color
  const getStatusColor = (status) => {
    if (!status) return '#9CA3AF';
    
    switch (status.toLowerCase()) {
      case 'available': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'offline': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  return (
    <View style={[styles.infoPanel, !isExpanded && styles.infoPanelCollapsed]}>
      {/* Header with toggle */}
      <TouchableOpacity 
        style={styles.panelHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.panelTitle}>
            {technician.name || 'Technician'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor(technician.status)}]} />
            <Text style={styles.statusText}>{technician.status || 'Unknown'}</Text>
          </View>
        </View>
        <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▲'}</Text>
      </TouchableOpacity>
      
      {/* Collapsible content */}
      {isExpanded && (
        <>
          <View style={styles.divider} />
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Latitude:</Text>
              <Text style={styles.infoValue}>
                {parseCoordinate(technician.latitude).toFixed(6)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Longitude:</Text>
              <Text style={styles.infoValue}>
                {parseCoordinate(technician.longitude).toFixed(6)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Update:</Text>
              <Text style={styles.infoValue}>
                {formatTime(technician.timestamp || lastUpdate)}
              </Text>
            </View>

            {/* Add a dropdown in InfoPanel to change technician status */}
            <View style={styles.statusSelector}>
              <Text style={styles.infoLabel}>Change Status:</Text>
              <View style={styles.statusButtons}>
                {['available', 'busy', 'offline'].map(status => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.statusButton, 
                      technician.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => {
                      // Create a WebSocket connection for sending status updates
                      const statusSocket = new WebSocket('ws://10.171.35.189:8000/ws/technician/');
                      
                      // Wait for connection to open before sending
                      statusSocket.onopen = () => {
                        statusSocket.send(JSON.stringify({
                          type: 'status_update',
                          technicianId: technician.id || 'badr_Vinci',
                          status: status
                        }));
                        
                        // Close socket after sending
                        setTimeout(() => statusSocket.close(), 1000);
                      };
                      
                      // Handle any errors
                      statusSocket.onerror = (error) => {
                        console.error('WebSocket error when updating status:', error);
                      };
                      
                      // Update UI optimistically
                      // This makes the UI respond immediately even if network is slow
                      technician.status = status;
                    }}
                  >
                    <Text style={styles.statusButtonText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoPanelCollapsed: {
    paddingBottom: 8, 
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
  },
  toggleIcon: {
    fontSize: 16,
    color: '#64748B',
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoContainer: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  statusSelector: {
    marginTop: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  statusButtonActive: {
    backgroundColor: '#3B82F6',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});