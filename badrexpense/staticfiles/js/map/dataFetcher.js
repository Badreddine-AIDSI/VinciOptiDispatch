// dataFetcher.js
import { mapStateManager } from './mapStateManager.js';
import { markerUtils } from './markerUtils.js';

export const dataFetcher = {
    // WebSocket connection
    socket: null,
    
    // Initialize WebSocket connection
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/tasks/`;
        
        this.socket = new WebSocket(wsUrl);
        
        // Connection opened
        this.socket.addEventListener('open', (event) => {
            console.log('WebSocket connection established');
            // Request initial data
            this.fetchDataViaWebSocket();
        });
        
        // Listen for messages
        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'update') {
                // Handle single task update
                this.handleTaskUpdate(data.data);
            } else if (data.type === 'task_data') {
                // Handle complete data refresh
                this.processDispatchData(data.data);
            }
        });
        
        // Connection closed
        this.socket.addEventListener('close', (event) => {
            console.log('WebSocket connection closed');
            // Try to reconnect after a delay
            setTimeout(() => this.initWebSocket(), 5000);
        });
        
        // Error handling
        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    },
    
    // Fetch data via WebSocket
    fetchDataViaWebSocket() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'fetch_tasks'
            }));
        } else {
            console.warn('WebSocket not ready, falling back to HTTP');
            this.fetchData();
        }
    },
    
    // Handle single task update
    handleTaskUpdate(taskData) {
        const state = mapStateManager.state;
        const taskId = taskData.task_id;
        
        // Function to find and update task in array
        const updateTaskInArray = (taskArray, taskId, newData) => {
            const index = taskArray.findIndex(task => task.id === taskId);
            if (index !== -1) {
                // Update task with new data
                taskArray[index] = { ...taskArray[index], ...newData };
                return true;
            }
            return false;
        };
        
        // Determine which array the task belongs to based on status
        const arrays = {
            'unassigned': state.unassignedTasks,
            'assigned': state.assignedTasks,
            'in-transit': state.inTransitTasks,
            'succeeded': state.succeededTasks,
            'failed': state.failedTasks
        };
        
        // Find which array currently contains the task
        let foundInArray = false;
        let currentArray = null;
        
        for (const [status, array] of Object.entries(arrays)) {
            if (array && updateTaskInArray(array, taskId, taskData)) {
                foundInArray = true;
                currentArray = status;
                break;
            }
        }
        
        // If status changed, move task to the appropriate array
        if (foundInArray && currentArray !== taskData.status) {
            // Remove from current array
            const taskIndex = arrays[currentArray].findIndex(task => task.id === taskId);
            const taskToMove = arrays[currentArray][taskIndex];
            arrays[currentArray].splice(taskIndex, 1);
            
            // Add to new array based on status
            if (arrays[taskData.status]) {
                arrays[taskData.status].push({ ...taskToMove, ...taskData });
            }
        }
        
        // Update technician task list if assigned
        if (taskData.assigned_to && state.technicians) {
            state.technicians.forEach(tech => {
                if (tech.name === taskData.assigned_to) {
                    const techTaskIndex = tech.tasks.findIndex(task => task.id === taskId);
                    if (techTaskIndex !== -1) {
                        tech.tasks[techTaskIndex] = { ...tech.tasks[techTaskIndex], ...taskData };
                    } else {
                        tech.tasks.push({ ...taskData });
                    }
                }
            });
        }
        
        // Update markers
        this.updateMarkers();
    },

    // Core method to fetch dispatch data from server (fallback if WebSocket fails)
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
        if (!data) {
            console.warn('No valid dispatch data received');
            return;
        }
    
        console.log('Processing dispatch data:', data);
    
        // 1. Update state managers with available arrays
        if (data.technicians) {
            mapStateManager.updateTechnicians(data.technicians);
        }
        
        mapStateManager.updateUnassignedTasks(data.unassigned_tasks || []);
        mapStateManager.updateAssignedTasks(data.assigned_tasks || []);
        mapStateManager.updateInTransitTasks(data.in_transit_tasks || []);
        mapStateManager.updateSucceededTasks(data.succeeded_tasks || []);
        mapStateManager.updateFailedTasks(data.failed_tasks || []);
    
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
        if (state.technicians) {
            state.technicians.forEach(tech => {
                if (tech.tasks) {
                    tech.tasks.forEach(task => this.addMarker(task, markerIcons));
                }
            });
        }

        // Add unassigned task markers
        if (state.unassignedTasks) {
            state.unassignedTasks.forEach(task => {
                this.addMarker(task, markerIcons);
            });
        }
        
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
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ technician_id: technicianId })
            });
            
            if (!response.ok) throw new Error('Failed to assign task');
            
            // If WebSocket is available, it will handle the update
            // Otherwise, fall back to HTTP refetch
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                await this.fetchData();
            }
        } catch (err) {
            console.error('Error assigning task:', err);
        }
    },
    
    async startTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/start/`, {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (!response.ok) throw new Error('Failed to start task');
            
            // If WebSocket is available, it will handle the update
            // Otherwise, fall back to HTTP refetch
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                await this.fetchData();
            }
        } catch (err) {
            console.error('Error starting task:', err);
        }
    },
    
    async completeTask(taskId, result) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/complete/`, {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ result }) // 'succeeded' or 'failed'
            });
            
            if (!response.ok) throw new Error('Failed to complete task');
            
            // If WebSocket is available, it will handle the update
            // Otherwise, fall back to HTTP refetch
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                await this.fetchData();
            }
        } catch (err) {
            console.error('Error completing task:', err);
        }
    },
    
    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    },
    
    handleTaskFormSubmission: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(e.target.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': this.getCsrfToken() }
            });
    
            const data = await response.json();
            
            if (data.status === 'success') {
                // ✅ Fermer proprement le modal
                const modalElement = document.getElementById('newTaskModal');
                let modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (!modalInstance) {
                    modalInstance = new bootstrap.Modal(modalElement);
                }
                modalInstance.hide();
    
                // ✅ Reset du formulaire
                e.target.reset();
    
                // ✅ Reset UI
                if (typeof uiControllers !== 'undefined' && uiControllers.resetTaskAddingState) {
                    uiControllers.resetTaskAddingState();
                }
    
                // ✅ Refresh fallback
                if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                    await this.fetchData();
                }
    
                // ✅ Message succès
                this.showFlashMessage('Task created successfully!', 'success');
            } else {
                this.showFlashMessage(data.message || 'Failed to create task', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showFlashMessage('Error creating task. Please try again.', 'danger');
        }
    },
    
    

    // Add flash message display functionality
    showFlashMessage(message, type = 'info') {
        const flashContainer = document.getElementById('flashMessages');
        if (!flashContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        flashContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    },

    // Add connection status monitoring
    monitorConnection() {
        setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Send ping every 30 seconds
    },

    // Initialize all components
    initialize() {
        this.initWebSocket();
        this.monitorConnection();
        
        // Set up periodic data refresh as fallback
        setInterval(() => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                this.fetchData();
            }
        }, 60000); // Fallback refresh every 60 seconds
    }
};