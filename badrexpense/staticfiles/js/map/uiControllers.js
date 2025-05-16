// uiControllers.js
import { mapStateManager } from './mapStateManager.js';
import { markerUtils } from './markerUtils.js';
import { dataFetcher } from './dataFetcher.js';

export const uiControllers = {
    handleNewTaskButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const state = mapStateManager.state;
        const map = state.map;
        const newTaskBtn = e.currentTarget;

        mapStateManager.toggleAddingTask();

        if (state.isAddingTask) {
            newTaskBtn.classList.add('active');
            newTaskBtn.style.backgroundColor = '#dc3545';
            map.getContainer().style.cursor = 'crosshair';
        } else {
            this.resetTaskAddingState();
        }
    },

    resetTaskAddingState() {
        const state = mapStateManager.state;
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
            mapStateManager.setTempMarker(null);
        }

        newTaskModal.hide();
        newTaskForm?.reset();
    },

// Update the handleMapClick function in uiControllers.js
    handleMapClick: function(e) {
        try {
            const state = mapStateManager.state;
            if (!state.isAddingTask) return;

            const latlng = e.latlng;
            
            // Check if the modal element exists
            const modalElement = document.getElementById('newTaskModal');
            if (!modalElement) {
                console.error('Modal element not found');
                return;
            }
            
            // Check if the priority select element exists
            const prioritySelect = document.getElementById('priority');
            if (!prioritySelect) {
                console.error('Priority select element not found');
                return;
            }
            
            // Make sure bootstrap is defined
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap is not defined');
                return;
            }
            
            const newTaskModal = new bootstrap.Modal(modalElement);

            // Update form fields
            uiControllers.updateFormFieldsOnMapClick(latlng, prioritySelect);
            
            // Create temporary marker
            uiControllers.createTemporaryMarker(latlng, prioritySelect);
            
            // Perform reverse geocoding
            uiControllers.reverseGeocodeAndShowModal(latlng, newTaskModal);
        } catch (error) {
            console.error('Error handling map click:', error);
        }
    },

    updateFormFieldsOnMapClick(latlng, prioritySelect) {
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
    },

    // uiControllers.js - update the createTemporaryMarker function
    createTemporaryMarker: function(latlng, prioritySelect) {
        try {
            const state = mapStateManager.state;
            
            if (!state.map) {
                console.error('Map not initialized');
                return;
            }
            
            // Create a simple default icon using Leaflet's CDN
            const defaultIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            // Create the marker with the default icon
            const tempMarker = L.marker([latlng.lat, latlng.lng], {
                icon: defaultIcon
            });
            
            // Add to map
            tempMarker.addTo(state.map);
            
            // Store in state
            mapStateManager.setTempMarker(tempMarker);
        } catch (error) {
            console.error('Error creating temporary marker:', error);
        }
    },
    reverseGeocodeAndShowModal: function(latlng, newTaskModal) {
        try {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    const addressField = document.getElementById('address');
                    if (addressField) {
                        addressField.value = data.display_name || '';
                    }
                    newTaskModal.show();
                })
                .catch(err => {
                    console.error('Geocoding error:', err);
                    newTaskModal.show();
                });
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
            try {
                newTaskModal.show();
            } catch (modalError) {
                console.error('Error showing modal:', modalError);
            }
        }
    },
    // uiControllers.js - fix the handleTaskFormSubmission function
    handleTaskFormSubmission: function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const getCsrfToken = function() {
            const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
            return csrfInput ? csrfInput.value : '';
        };
        
        try {
            fetch(e.target.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': getCsrfToken() }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    uiControllers.resetTaskAddingState();
                    dataFetcher.fetchData();
                    alert(data.message);
                } else {
                    alert('Failed to create task. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating task. Please try again.');
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error creating task. Please try again.');
        }
    },

    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    },

};