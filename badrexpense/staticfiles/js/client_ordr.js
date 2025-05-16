document.addEventListener("DOMContentLoaded", function() {
    // Configuration and Constants
    const MAP_CENTER = [33.5731, -7.5898];
    const MAP_ZOOM = 13;

    // State Management
    const state = {
        map: null,
        tempMarker: null,
        isAddingTask: false,
        markers: [],
        technicians: [],
        unassignedTasks: []
    };

    // Marker Icons
    const markerIcons = {
        blue: createMarkerIcon('blue'),
        purple: createMarkerIcon('purple'),
        green: createMarkerIcon('green'),
        yellow: createMarkerIcon('yellow'),
        red: createMarkerIcon('red')
    };

    // Utility Functions
    function createMarkerIcon(color) {
        return new L.Icon({
            iconUrl: `/static/images/marker-icon-${color}.png`,
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    function getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    // Map Initialization
    function initializeMap() {
        try {
            const mapElement = document.getElementById('leafletMap');
            if (!mapElement) {
                console.error('Map element not found');
                return null;
            }

            const map = L.map('leafletMap', {
                zoomControl: false,
                attributionControl: true
            }).setView(MAP_CENTER, MAP_ZOOM);
            
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

    // Map Controls Initialization
    function initializeMapControls(map) {
        const controls = {
            zoomIn: document.getElementById('zoomInBtn'),
            zoomOut: document.getElementById('zoomOutBtn'),
            center: document.getElementById('centerBtn'),
            newTask: document.getElementById('newTaskBtn')
        };

        // Zoom In
        if (controls.zoomIn) {
            controls.zoomIn.addEventListener('click', () => map.zoomIn());
        }

        // Zoom Out
        if (controls.zoomOut) {
            controls.zoomOut.addEventListener('click', () => map.zoomOut());
        }

        // Center Map
        if (controls.center) {
            controls.center.addEventListener('click', () => map.setView(MAP_CENTER, MAP_ZOOM));
        }

        // New Task Button
        if (controls.newTask) {
            controls.newTask.addEventListener('click', handleNewTaskButtonClick);
        }
    }

    // Handle New Task Button Click
    function handleNewTaskButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        state.isAddingTask = !state.isAddingTask;
        const newTaskBtn = e.currentTarget;
        const map = state.map;

        if (state.isAddingTask) {
            newTaskBtn.classList.add('active');
            newTaskBtn.style.backgroundColor = '#dc3545';
            map.getContainer().style.cursor = 'crosshair';
        } else {
            resetTaskAddingState();
        }
    }

    // Reset Task Adding State
    function resetTaskAddingState() {
        state.isAddingTask = false;
        const newTaskBtn = document.getElementById('newTaskBtn');
        const newTaskModal = new bootstrap.Modal(document.getElementById('newTaskModal'));
        const newTaskForm = document.getElementById('newTaskForm');

        if (newTaskBtn) {
            newTaskBtn.classList.remove('active');
            newTaskBtn.style.backgroundColor = '#fff';
        }

        if (state.map) {
            state.map.getContainer().style.cursor = '';
        }

        if (state.tempMarker) {
            state.map.removeLayer(state.tempMarker);
            state.tempMarker = null;
        }

        newTaskModal.hide();
        newTaskForm?.reset();
    }

    // Map Click Handler for Adding Tasks
    function handleMapClick(e) {
        if (!state.isAddingTask) return;

        const latlng = e.latlng;
        const prioritySelect = document.getElementById('priority');
        const newTaskModal = new bootstrap.Modal(document.getElementById('newTaskModal'));

        // Update form fields
        updateFormFieldsOnMapClick(latlng, prioritySelect);

        // Create temporary marker
        createTemporaryMarker(latlng, prioritySelect);

        // Reverse geocode and show modal
        reverseGeocodeAndShowModal(latlng, newTaskModal);
    }

    // Update Form Fields on Map Click
    function updateFormFieldsOnMapClick(latlng, prioritySelect) {
        document.getElementById('latitude').value = latlng.lat.toFixed(6);
        document.getElementById('longitude').value = latlng.lng.toFixed(6);

        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 3600 * 1000);
        const twoHoursLater = new Date(now.getTime() + 2 * 3600 * 1000);

        const dateFields = {
            scheduled: { date: 'scheduled_date', time: 'scheduled_time' },
            estimated: { date: 'estimated_date', time: 'estimated_time' },
            actual: { date: 'actual_date', time: 'actual_time' }
        };

        Object.entries(dateFields).forEach(([key, fields], index) => {
            const date = index === 0 ? now : (index === 1 ? oneHourLater : twoHoursLater);
            document.getElementById(fields.date).value = date.toISOString().slice(0, 10);
            document.getElementById(fields.time).value = date.toTimeString().slice(0, 5);
        });
    }

    // Create Temporary Marker
    function createTemporaryMarker(latlng, prioritySelect) {
        if (state.tempMarker) {
            state.map.removeLayer(state.tempMarker);
        }

        state.tempMarker = L.marker(latlng, {
            icon: markerIcons[prioritySelect.value] || markerIcons.blue
        }).addTo(state.map);
    }

    // Reverse Geocode and Show Modal
    function reverseGeocodeAndShowModal(latlng, newTaskModal) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById('address').value = data.display_name || '';
                newTaskModal.show();
            })
            .catch(err => {
                console.error('Geocoding error:', err);
                newTaskModal.show();
            });
    }

    // Task Form Submission Handler
    function handleTaskFormSubmission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        fetch(e.target.action, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCsrfToken() }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                resetTaskAddingState();
                fetchData();
                alert(data.message);
            } else {
                alert('Failed to create task. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating task. Please try again.');
        });
    }

    // Fetch Data
    function fetchData() {
        fetch('/clientorder/api/dispatch-data/', {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            state.technicians = data.technicians || [];
            state.unassignedTasks = data.unassigned_tasks || [];

            updateMarkers();
            updateTaskList();
        })
        .catch(error => console.error('Error fetching data:', error));
    }

    // Update Markers
    function updateMarkers() {
        clearMarkers();
        
        state.technicians.forEach(tech => {
            tech.tasks.forEach(task => addMarker(task));
        });

        state.unassignedTasks.forEach(task => addMarker(task, true));
    }

    // Clear Markers
    function clearMarkers() {
        state.markers.forEach(marker => marker.remove());
        state.markers = [];
    }

    // Add Marker
    function addMarker(task, isUnassigned = false) {
        if (!task || !task.latitude || !task.longitude) return null;

        const icon = markerIcons[task.priority] || markerIcons.blue;
        const marker = L.marker([task.latitude, task.longitude], { icon });
        
        marker.bindPopup(createMarkerPopupContent(task));
        marker.addTo(state.map);
        state.markers.push(marker);

        return marker;
    }

    // Create Marker Popup Content
    function createMarkerPopupContent(task) {
        return `
            <div class="popup-content">
                <h6>${task.recipient_name || 'No Recipient'}</h6>
                <p>${task.address || 'No Address'}</p>
                <p>Status: ${task.status || 'Unknown'}</p>
                <p>Priority: ${task.priority || 'Not Set'}</p>
                ${task.team ? `<p>Team: ${task.team}</p>` : ''}
                ${task.scheduled_time ? `<p>Scheduled: ${new Date(task.scheduled_time).toLocaleString()}</p>` : ''}
            </div>
        `;
    }

    // Update Task List
    function updateTaskList() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        taskList.innerHTML = '';
        
        // Unassigned Tasks
        if (state.unassignedTasks.length > 0) {
            const unassignedSection = createTaskSection('Unassigned Tasks', state.unassignedTasks, 'text-danger');
            taskList.appendChild(unassignedSection);
        }
        
        // Technician Tasks
        state.technicians.forEach(tech => {
            if (tech.tasks.length > 0) {
                const techSection = createTaskSection(`${tech.name}'s Tasks`, tech.tasks, 'text-primary');
                taskList.appendChild(techSection);
            }
        });
    }

    // Create Task Section
    function createTaskSection(title, tasks, titleClass) {
        const section = document.createElement('div');
        section.className = 'mb-4';
        section.innerHTML = `
            <h5 class="${titleClass}">${title}</h5>
            <div class="list-group">
                ${tasks.map(task => `
                    <div class="list-group-item bg-dark text-light">
                        <h6>${task.recipient_name}</h6>
                        <p class="mb-1">${task.address}</p>
                        <small>Priority: ${task.priority}</small>
                    </div>
                `).join('')}
            </div>
        `;
        return section;
    }

    // Initialization
    function init() {
        state.map = initializeMap();
        if (!state.map) return;

        initializeMapControls(state.map);
        
        // Event Listeners
        state.map.on('click', handleMapClick);
        
        const newTaskForm = document.getElementById('newTaskForm');
        if (newTaskForm) {
            newTaskForm.addEventListener('submit', handleTaskFormSubmission);
        }

        // Initial Data Fetch
        fetchData();

        // Periodic Data Refresh
        setInterval(fetchData, 30000);

        // Collapsible Sections Setup
        setupCollapsibleSections();
    }

    // Setup Collapsible Sections
    function setupCollapsibleSections() {
        document.querySelectorAll('.section-header.expandable').forEach(header => {
            header.addEventListener('click', function() {
                this.classList.toggle('collapsed');
                
                const content = this.nextElementSibling;
                if (content && content.classList.contains('section-content')) {
                    const isCollapsed = this.classList.contains('collapsed');
                    content.style.display = isCollapsed ? 'none' : 'block';
                    
                    const icon = this.querySelector('.toggle-icon');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down', !isCollapsed);
                        icon.classList.toggle('fa-chevron-right', isCollapsed);
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
    }

    // Start the application
    init();
});