import { mapStateManager } from './mapStateManager.js';
import { markerUtils } from './markerUtils.js';
import { uiControllers } from './uiControllers.js';
import { dataFetcher } from './dataFetcher.js';

export const mapInitializer = {
    MAP_CENTER: [33.5731, -7.5898],
    MAP_ZOOM: 13,

    initializeMap() {
        try {
            const mapElement = document.getElementById('leafletMap');
            if (!mapElement) {
                console.error('Map element not found. Ensure #leafletMap exists in the HTML.');
                return null;
            }

            // Verify Leaflet is available
            if (typeof L === 'undefined') {
                console.error('Leaflet library not loaded. Include Leaflet script before your modules.');
                return null;
            }

            // Ensure the map element has a height
            if (window.getComputedStyle(mapElement).height === '0px') {
                console.warn('Map element has no height. Setting a default height.');
                mapElement.style.height = '500px';
            }

            const map = L.map('leafletMap', {
                zoomControl: false,
                attributionControl: true
            }).setView(this.MAP_CENTER, this.MAP_ZOOM);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB',
                maxZoom: 19
            }).addTo(map);

            console.log('Map initialized successfully');
            mapStateManager.setMap(map);
            return map;
        } catch (error) {
            console.error('Comprehensive map initialization error:', error);
            return null;
        }
    },

// In mapInitializer.js - Fix the button attachment
    initializeMapControls(map) {
        if (!map) {
            console.error('Cannot initialize map controls: map is null');
            return;
        }

        try {
            const controls = {
                zoomIn: document.getElementById('zoomInBtn'),
                zoomOut: document.getElementById('zoomOutBtn'),
                center: document.getElementById('centerBtn'),
                newTask: document.getElementById('newTaskBtn')
            };

            if (controls.zoomIn) {
                controls.zoomIn.addEventListener('click', () => map.zoomIn());
            }

            if (controls.zoomOut) {
                controls.zoomOut.addEventListener('click', () => map.zoomOut());
            }

            if (controls.center) {
                controls.center.addEventListener('click', () => map.setView(this.MAP_CENTER, this.MAP_ZOOM));
            }

            if (controls.newTask) {
                controls.newTask.addEventListener('click', (e) => uiControllers.handleNewTaskButtonClick(e));
            } else {
                console.warn('New task button not found');
            }
        } catch (error) {
            console.error('Error initializing map controls:', error);
        }
    },

    setupMapClickHandler() {
        const map = mapStateManager.state.map;
        if (!map) {
            console.error('Cannot set up map click handler: map is null');
            return;
        }
        map.on('click', uiControllers.handleMapClick);
    },

    init() {
        const map = this.initializeMap();
        if (!map) {
            console.error('Map initialization failed');
            return;
        }

        this.initializeMapControls(map);
        this.setupMapClickHandler();
        
        const newTaskForm = document.getElementById('newTaskForm');
        if (newTaskForm) {
            newTaskForm.addEventListener('submit', uiControllers.handleTaskFormSubmission);
        }

        // Initial Data Fetch
        dataFetcher.fetchData.bind(dataFetcher)();

        // Periodic Data Refresh
        setInterval(() => dataFetcher.fetchData(), 30000);

        // Setup Collapsible Sections
        this.setupCollapsibleSections();
    },

    setupCollapsibleSections() {
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
};