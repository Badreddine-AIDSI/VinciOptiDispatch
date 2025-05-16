document.addEventListener("DOMContentLoaded", function() {
    // Initialize variables
    let map = null;
    let tempMarker = null;
    let isAddingTask = false;
    let markers = [];
    let clickTimeout = null;

    // Initialize the map with dark style
    function initializeMap() {
        try {
            const mapElement = document.getElementById('leafletMap');
            if (!mapElement) {
                console.error('Map element not found');
                return null;
            }

            const map = L.map('leafletMap', {
                zoomControl: false,  // Disable default zoom control
                attributionControl: true
            }).setView([33.5731, -7.5898], 13);
            
            // Custom dark map style
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB',
                maxZoom: 19
            }).addTo(map);

            return map;
        } catch (error) {
            console.error('Error initializing map:', error);
            return null;
        }
    }

    // Initialize map with safety check
    map = initializeMap();
    if (!map) {
        console.error('Failed to initialize map');
        return;  // Exit early if map initialization fails
    }

    // Make map instance globally available
    window.themeMap = map;

    // Custom marker icons
    const markerIcons = {
        blue: new L.Icon({
            iconUrl: '/static/images/marker-icon-blue.png',
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        purple: new L.Icon({
            iconUrl: '/static/images/marker-icon-purple.png',
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        green: new L.Icon({
            iconUrl: '/static/images/marker-icon-green.png',
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        yellow: new L.Icon({
            iconUrl: '/static/images/marker-icon-yellow.png',
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        red: new L.Icon({
            iconUrl: '/static/images/marker-icon-red.png',
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    };

    // Initialize the Bootstrap modal
    const newTaskModal = new bootstrap.Modal(document.getElementById('newTaskModal'));

    // Handle priority change to update marker color
    const prioritySelect = document.getElementById('priority');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', function() {
            if (tempMarker && map) {
                const newIcon = markerIcons[this.value] || markerIcons.blue;
                tempMarker.setIcon(newIcon);
            }
        });
    }

    // Handle map controls
    function initializeControls() {
        // Get control buttons
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const centerBtn = document.getElementById('centerBtn');
        const newTaskBtn = document.getElementById('newTaskBtn');

        // Create control container if it doesn't exist
        let controlContainer = document.querySelector('.map-controls');
        if (!controlContainer) {
            controlContainer = document.createElement('div');
            controlContainer.className = 'map-controls';
            controlContainer.style.position = 'absolute';
            controlContainer.style.top = '10px';
            controlContainer.style.right = '10px';
            controlContainer.style.zIndex = '1000';
            document.getElementById('leafletMap').appendChild(controlContainer);
        }

        // Initialize zoom in button
        if (zoomInBtn) {
            zoomInBtn.style.display = 'block';  // Ensure visibility
            zoomInBtn.addEventListener('click', () => {
                if (map) map.zoomIn();
            });
        }

        // Initialize zoom out button
        if (zoomOutBtn) {
            zoomOutBtn.style.display = 'block';  // Ensure visibility
            zoomOutBtn.addEventListener('click', () => {
                if (map) map.zoomOut();
            });
        }

        // Initialize center button
        if (centerBtn) {
            centerBtn.style.display = 'block';  // Ensure visibility
            centerBtn.addEventListener('click', () => {
                if (map) map.setView([33.5731, -7.5898], 13);
            });
        }

        // Initialize new task button
        if (newTaskBtn) {
            // Prevent any default behaviors
            newTaskBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
            }, { passive: false });

            newTaskBtn.addEventListener('mousedown', function(e) {
                e.preventDefault();
            }, { passive: false });

            // Main click handler
            newTaskBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Clear any existing timeout
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }

                // Immediate visual feedback
                this.style.backgroundColor = '#dc3545';
                
                // Set a timeout to handle the actual state change
                clickTimeout = setTimeout(() => {
                    isAddingTask = !isAddingTask;
                    
                    if (isAddingTask) {
                        this.classList.add('active');
                        this.style.backgroundColor = '#dc3545';
                        if (map) {
                            map.getContainer().style.cursor = 'crosshair';
                        }
                    } else {
                        this.classList.remove('active');
                        this.style.backgroundColor = '#fff';
                        if (map) {
                            map.getContainer().style.cursor = '';
                        }
                        if (tempMarker && map) {
                            map.removeLayer(tempMarker);
                            tempMarker = null;
                        }
                    }
                }, 50); // Small delay to ensure Safari processes the click
            }, { passive: false });
        }
    }

    // Initialize controls after map is ready
    map.on('load', function() {
        initializeControls();
    });

    // Also initialize controls immediately in case the load event has already fired
    initializeControls();

    // Map click handler for adding new tasks
    if (map) {
        map.on('click', function(e) {
            if (!isAddingTask || !map) return;

            const latlng = e.latlng;
            
            try {
                // Update coordinates with explicit null checks
                const latitudeField = document.getElementById('latitude');
                const longitudeField = document.getElementById('longitude');
                
                if (latitudeField) latitudeField.value = latlng.lat.toFixed(6);
                if (longitudeField) longitudeField.value = latlng.lng.toFixed(6);

                // Handle temporary marker with safety checks
                if (tempMarker && map && map.hasLayer(tempMarker)) {
                    map.removeLayer(tempMarker);
                }

                // Get the selected priority from the form
                const prioritySelect = document.getElementById('priority');
                const selectedPriority = prioritySelect ? prioritySelect.value : 'blue';

                // Create and add temporary marker with safety check
                try {
                    tempMarker = L.marker(latlng, {
                        icon: markerIcons[selectedPriority] || markerIcons.blue
                    });
                    
                    if (map && tempMarker) {
                        tempMarker.addTo(map);
                    }
                } catch (markerError) {
                    console.error('Error creating temporary marker:', markerError);
                }

                // Get address from coordinates
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`, {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent': 'TaskManagementSystem'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    const addressInput = document.getElementById('address');
                    if (addressInput) {
                        addressInput.value = data.display_name;
                    }
                })
                .catch(console.error);

                // Set current date and time values
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour later
                const twoHoursLater = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later

                // Format date as YYYY-MM-DD
                const formatDate = (date) => date.toISOString().split('T')[0];
                // Format time as HH:mm
                const formatTime = (date) => date.toTimeString().slice(0, 5);

                // Set scheduled time (current time)
                const scheduledDate = document.getElementById('scheduled_date');
                const scheduledTime = document.getElementById('scheduled_time');
                if (scheduledDate) scheduledDate.value = formatDate(now);
                if (scheduledTime) scheduledTime.value = formatTime(now);

                // Set estimated completion time (1 hour later)
                const estimatedDate = document.getElementById('estimated_date');
                const estimatedTime = document.getElementById('estimated_time');
                if (estimatedDate) estimatedDate.value = formatDate(oneHourLater);
                if (estimatedTime) estimatedTime.value = formatTime(oneHourLater);

                // Set actual completion time (2 hours later)
                const actualDate = document.getElementById('actual_date');
                const actualTime = document.getElementById('actual_time');
                if (actualDate) actualDate.value = formatDate(twoHoursLater);
                if (actualTime) actualTime.value = formatTime(twoHoursLater);

                // Show modal
                newTaskModal.show();
            } catch (error) {
                console.error('Error handling map click:', error);
                resetTaskAddingState();
            }
        });
    }

    // Helper function to reset task adding state
    function resetTaskAddingState() {
        isAddingTask = false;
        if (newTaskBtn) {
            newTaskBtn.classList.remove('active');
            newTaskBtn.style.backgroundColor = '#fff';
        }
        if (map) {
            map.getContainer().style.cursor = '';
        }
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    }

    // Handle form submission
    const newTaskForm = document.getElementById('newTaskForm');
    if (newTaskForm) {
        newTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                resetTaskAddingState();
                newTaskModal.hide();
                this.reset();
                fetchData();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating task. Please try again.');
            });
        });
    }

    // Handle modal close
    document.getElementById('newTaskModal')?.addEventListener('hidden.bs.modal', function () {
        resetTaskAddingState();
        newTaskForm?.reset();
    });

    let state = {
        technicians: [
            { 
                id: 1, 
                name: "Dhruv Bhoot",
                tasks: [
                    { address: "929 Market Street", recipient: "Tatiana Grebennique", time: "2:14 PM" },
                    { address: "929 Market Street", recipient: "Abdullah Altamami", time: "2:25 PM" }
                ],
                status: "in transit",
                marker: null
            },
            { 
                id: 2,
                name: "Ivan A. Tolmachev",
                tasks: [
                    { address: "570 Pacific Avenue", recipient: "No recipient", time: "2:07 PM" },
                    { address: "470-508 Presidio Boulevard", recipient: "Blair Wichita", time: "2:32 PM" },
                    { address: "3825 Clay Street", recipient: "Alex Sjoman", time: "2:48 PM" }
                ],
                status: "in transit",
                marker: null
            }
        ],
        unassignedTasks: [
            { address: "115 Stillman Street", recipient: "Maricela Salcido" },
            { address: "1200 Seaport Boulevard", recipient: "Ivan Tolmachev" },
            { address: "201 Industrial Road", recipient: "Dhruv Bhoot" }
        ]
    };

    function clearMarkers() {
        try {
            if (Array.isArray(markers)) {
                markers.forEach(marker => {
                    if (marker && typeof marker.remove === 'function') {
                        marker.remove();
                    }
                });
            }
            markers = [];
        } catch (error) {
            console.error('Error clearing markers:', error);
            markers = [];
        }
    }

    function addMarker(task, isUnassigned = false) {
        try {
            if (!map) {
                console.warn('Map not initialized');
                return null;
            }

            if (!task || typeof task.latitude === 'undefined' || typeof task.longitude === 'undefined') {
                console.warn('Invalid task coordinates:', task);
                return null;
            }

            // Use priority color or default to blue
            const icon = markerIcons[task.priority] || markerIcons.blue;
            if (!icon) {
                console.warn('Invalid marker icon');
                return null;
            }

            let marker;
            try {
                marker = L.marker([task.latitude, task.longitude], { icon });
            } catch (markerError) {
                console.error('Error creating marker:', markerError);
                return null;
            }
            
            if (!marker) {
                console.warn('Failed to create marker');
                return null;
            }

            // Add to map with safety check
            try {
                if (map && marker) {
                    marker.addTo(map);
                    markers.push(marker);
                }
            } catch (addError) {
                console.error('Error adding marker to map:', addError);
                return null;
            }
            
            // Create popup content with null checks
            const popupContent = `
                <div class="popup-content">
                    <h6>${task.recipient_name || 'No Recipient'}</h6>
                    <p>${task.address || 'No Address'}</p>
                    <p>Status: ${task.status || 'Unknown'}</p>
                    <p>Priority: ${task.priority || 'Not Set'}</p>
                    ${task.team ? `<p>Team: ${task.team}</p>` : ''}
                    ${task.scheduled_time ? `<p>Scheduled: ${new Date(task.scheduled_time).toLocaleString()}</p>` : ''}
                </div>
            `;
            
            marker.bindPopup(popupContent);
            return marker;
        } catch (error) {
            console.error('Error in addMarker:', error);
            return null;
        }
    }

    // Function to update markers based on current state
    function updateMarkers() {
        try {
            clearMarkers();
            
            // Add markers for technician tasks
            if (Array.isArray(state.technicians)) {
                state.technicians.forEach(tech => {
                    if (tech && Array.isArray(tech.tasks)) {
                        tech.tasks.forEach(task => {
                            if (task) {
                                addMarker(task, false);
                            }
                        });
                    }
                });
            }
            
            // Add markers for unassigned tasks
            if (Array.isArray(state.unassignedTasks)) {
                state.unassignedTasks.forEach(task => {
                    if (task) {
                        addMarker(task, true);
                    }
                });
            }
        } catch (error) {
            console.error('Error updating markers:', error);
        }
    }


        // Add technician sections
        state.technicians.forEach(tech => {
            if (tech.tasks.length > 0) {
                const techSection = document.createElement('div');
                techSection.className = 'mb-4';
                techSection.innerHTML = `
                    <h5 class="text-primary">${tech.name}'s Tasks</h5>
                    <div class="list-group">
                        ${tech.tasks.map(task => `
                            <div class="list-group-item bg-dark text-light">
                                <h6>${task.recipient_name}</h6>
                                <p class="mb-1">${task.address}</p>
                                <small>Status: ${task.status}</small>
                            </div>
                        `).join('')}
                    </div>
                `;
                taskList.appendChild(techSection);
            }
        });
    }

    // Function to get CSRF token with fallback
    function getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!csrfInput) {
            console.warn('CSRF token not found in the page');
            return '';
        }
        return csrfInput.value;
    }

    // Function to fetch and update data
    function fetchData() {
        const csrfToken = getCsrfToken();
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
        
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        fetch('/clientorder/api/dispatch-data/', {
            headers: headers,
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            state.technicians = data.technicians || [];
            state.unassignedTasks = data.unassigned_tasks || [];
            updateMarkers();
            updateTaskList();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }

    // Initialize data and set up refresh interval
    fetchData();
    
    // Refresh data every 30 seconds but preserve button states
    setInterval(() => {
        const wasAddingTask = isAddingTask;
        const oldBtnStyle = document.getElementById('newTaskBtn')?.style.backgroundColor;
        
        fetchData();
        
        // Restore button state if it was active
        if (wasAddingTask) {
            const newTaskBtn = document.getElementById('newTaskBtn');
            if (newTaskBtn) {
                newTaskBtn.classList.add('active');
                newTaskBtn.style.backgroundColor = oldBtnStyle || '#dc3545';
                map.getContainer().style.cursor = 'crosshair';
            }
        }
    }, 30000);

    // Handle collapsible sections
    document.querySelectorAll('.section-header.expandable').forEach(header => {
        header.addEventListener('click', function() {
            // Toggle collapsed class
            this.classList.toggle('collapsed');
            
            // Find the next sibling which is the content section
            const content = this.nextElementSibling;
            if (content && content.classList.contains('section-content')) {
                if (this.classList.contains('collapsed')) {
                    content.style.display = 'none';
                    // Update icon
                    const icon = this.querySelector('.toggle-icon');
                    if (icon) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                    }
                } else {
                    content.style.display = 'block';
                    // Update icon
                    const icon = this.querySelector('.toggle-icon');
                    if (icon) {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            }
        });
    });

    // Initialize collapsed sections
    document.querySelectorAll('.section-header.expandable.collapsed').forEach(header => {
        const content = header.nextElementSibling;
        if (content && content.classList.contains('section-content')) {
            content.style.display = 'none';
        }
    });

    // Disable double click zoom on the map
    if (map) {
        map.doubleClickZoom.disable();
        
        // Prevent default touch behaviors
        map.getContainer().addEventListener('touchstart', function(e) {
            if (isAddingTask) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}); 