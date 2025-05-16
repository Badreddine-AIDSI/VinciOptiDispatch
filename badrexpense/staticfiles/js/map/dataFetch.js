// dataFetcher.js
import { mapStateManager } from './mapStateManager.js';
import { markerUtils } from './markerUtils.js';

export const dataFetcher = {
    // Core method to fetch dispatch data from server
    async fetchData() {
        try {
            const response = await fetch('/api/dispatch-data/', {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json' 
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.processDispatchData(data);
        } catch (error) {
            console.error('Error fetching dispatch data:', error);
            this.handleFetchError(error);
        }
    },

    // Process and update state with fetched data
    processDispatchData(data) { 
        // Validate incoming data
        if (!data || !data.technicians) {
            console.warn('No valid dispatch data received');
            return;
        }
    
        console.log('Processing dispatch data:', data);
    
        // 1. Update state managers with available arrays
        mapStateManager.updateTechnicians(data.technicians || []);
        mapStateManager.updateUnassignedTasks(data.unassigned_tasks || []);
    
        // Handle the other task status arrays
        if (data.assigned_tasks) {
            mapStateManager.updateAssignedTasks(data.assigned_tasks);
        }
        if (data.in_transit_tasks) {
            mapStateManager.updateInTransitTasks(data.in_transit_tasks);
        }
        if (data.succeeded_tasks) {
            mapStateManager.updateSucceededTasks(data.succeeded_tasks);
        }
        if (data.failed_tasks) {
            mapStateManager.updateFailedTasks(data.failed_tasks);
        }
    
        // 2. Refresh UI components
        this.updateMarkers();
    },

    // Handle fetch errors with potential retry or notification
    handleFetchError(error) {
        // Optionally implement error notification
        const errorNotification = document.getElementById('errorNotification');
        if (errorNotification) {
            errorNotification.textContent = 'Failed to load dispatch data. Please try again later.';
            errorNotification.style.display = 'block';
        }
    },

    // Update map markers based on current state
    updateMarkers() {
        const state = mapStateManager.state;
        const markerIcons = markerUtils.createMarkerIcons();

        // Clear existing markers
        mapStateManager.clearMarkers();
        
        // Add technician task markers
        state.technicians.forEach(tech => {
            tech.tasks.forEach(task => this.addMarker(task, markerIcons));
        });

        // Add unassigned task markers
        state.unassignedTasks.forEach(task => {
            this.addMarker(task, markerIcons);
        });
        
        // Add assigned task markers
        if (state.assignedTasks) {
            state.assignedTasks.forEach(task => {
                this.addMarker(task, markerIcons);
            });
        }
        
        // Add in-transit task markers
        if (state.inTransitTasks) {
            state.inTransitTasks.forEach(task => {
                this.addMarker(task, markerIcons);
            });
        }
        
        // Add succeeded task markers
        if (state.succeededTasks) {
            state.succeededTasks.forEach(task => {
                this.addMarker(task, markerIcons);
            });
        }
        
        // Add failed task markers
        if (state.failedTasks) {
            state.failedTasks.forEach(task => {
                this.addMarker(task, markerIcons);
            });
        }
    },

    // Create and add a single marker to the map
// dataFetcher.js - update the addMarker function
    addMarker(task, markerIcons) {
        // Validate task data
        if (!task) {
            console.warn('Task is null or undefined');
            return null;
        }
        
        if (typeof task !== 'object') {
            console.warn('Task is not an object:', task);
            return null;
        }
        
        // Check for required location properties
        if (!task.latitude || !task.longitude) {
            console.warn('Invalid task data for marker - missing coordinates:', task);
            return null;
        }
        
        try {
            // Create default icon in case the specified one fails
            const defaultIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            // Try to get icon for task status, fall back to default
            let icon;
            try {
                icon = markerIcons[task.status] || defaultIcon;
            } catch (iconError) {
                console.warn('Error getting marker icon:', iconError);
                icon = defaultIcon;
            }
            
            // Create marker
            const marker = L.marker([task.latitude, task.longitude], { icon });
            
            // Add popup content
            marker.bindPopup(markerUtils.createMarkerPopupContent(task));
            
            // Add to map and state
            marker.addTo(mapStateManager.state.map);
            mapStateManager.addMarker(marker);

            return marker;
        } catch (error) {
            console.error('Error adding marker:', error);
            return null;
        }
    },
        // Update task list in UI
   
    // Create a section for tasks (unassigned or per technician)
    createTaskSection(title, tasks, titleClass) {
        const section = document.createElement('div');
        section.className = 'mb-4';
        section.innerHTML = `
            <h5 class="${titleClass}">${title}</h5>
            <div class="list-group">
                ${tasks.map(task => `
                    <div class="list-group-item bg-dark text-light">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${task.recipient_name || 'Unknown Recipient'}</h6>
                            <small class="badge ${this.getPriorityBadgeClass(task.priority)}">
                                ${task.priority || 'No Priority'}
                            </small>
                        </div>
                        <p class="mb-1">${task.address || 'No Address'}</p>
                        <small class="text-muted">
                            ${task.scheduled_time ? `Scheduled: ${new Date(task.scheduled_time).toLocaleString()}` : 'No Schedule'}
                        </small>
                    </div>
                `).join('')}
            </div>
        `;
        return section;
    },

    // Helper to get bootstrap badge class based on priority
    getPriorityBadgeClass(priority) {
        const priorityClasses = {
            'high': 'bg-danger',
            'medium': 'bg-warning text-dark',
            'low': 'bg-info',
            'default': 'bg-secondary'
        };
        return priorityClasses[priority?.toLowerCase()] || priorityClasses['default'];
    },
    
    async assignTask(taskId, technicianId) {
        try {
          const response = await fetch(`/api/tasks/${taskId}/assign/`, {
            method: 'POST',
            headers: { 
              'Accept': 'application/json', 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ technician_id: technicianId })
          });
          if (!response.ok) throw new Error('Failed to assign task');
          // Optionally: handle assigned data here
          // Then refetch the entire dispatch data to update markers
          await this.fetchData();
        } catch (err) {
          console.error('Error assigning task:', err);
        }
    },
    
    /**
     * Mark a task as "in-transit" (i.e., started)
     */
    async startTask(taskId) {
        try {
          const response = await fetch(`/api/tasks/${taskId}/start/`, {
            method: 'POST',
            headers: { 
              'Accept': 'application/json', 
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) throw new Error('Failed to start task');
          // After successful start, refetch data
          await this.fetchData();
        } catch (err) {
          console.error('Error starting task:', err);
        }
    },
    
    /**
     * Mark a task as completed (for example, "succeeded")
     */
    async completeTask(taskId) {
        try {
          const response = await fetch(`/api/tasks/${taskId}/complete/`, {
            method: 'POST',
            headers: { 
              'Accept': 'application/json', 
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) throw new Error('Failed to complete task');
          // Then refetch the entire dispatch data
          await this.fetchData();
        } catch (err) {
          console.error('Error completing task:', err);
        }
    },
    handleTaskFormSubmission: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(e.target.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': uiControllers.getCsrfToken() }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                uiControllers.resetTaskAddingState();
                await dataFetcher.fetchData();
                alert(data.message);
            } else {
                alert('Failed to create task. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating task. Please try again.');
        }
    },
        // WebSocket related properties
    socket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,

    // Initialize WebSocket connection (call this once when app starts)
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/dispatch-updates/`;

        this.socket = new WebSocket(wsUrl);

        // Set up event handlers
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0; // Reset reconnect counter
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            // Handle different types of updates
            switch(message.type) {
                case 'FULL_UPDATE':
                    this.processDispatchData(message.data);
                    break;
                case 'TASK_UPDATE':
                    this.handleTaskUpdate(message.data);
                    break;
                case 'TECHNICIAN_UPDATE':
                    this.handleTechnicianUpdate(message.data);
                    break;
                default:
                    console.warn('Unknown WebSocket message type:', message.type);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.reason);
            this.handleSocketClose(event);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleSocketError(error);
        };
    },

    // Handle individual task updates
    handleTaskUpdate(updatedTask) {
        // Update specific task in state manager
        mapStateManager.updateTask(updatedTask);
        
        // Refresh UI markers
        this.updateMarkers();
        
        // Optionally update specific UI elements
        this.updateTaskInUI(updatedTask);
    },

    // Handle technician updates
    handleTechnicianUpdate(updatedTechnician) {
        mapStateManager.updateTechnician(updatedTechnician);
        this.updateMarkers();
        this.updateTechnicianInUI(updatedTechnician);
    },

    // Handle socket closure with reconnect logic
    handleSocketClose(event) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting reconnect in ${this.reconnectDelay/1000} seconds...`);
            setTimeout(() => {
                this.reconnectAttempts++;
                this.initializeWebSocket();
            }, this.reconnectDelay);
        } else {
            console.error('Maximum reconnect attempts reached. Staying disconnected.');
        }
    },

    // Handle socket errors
    handleSocketError(error) {
        console.error('WebSocket error:', error);
        // Implement any specific error handling here
    },

    
};
