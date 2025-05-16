// main.js
import { mapInitializer } from './mapInitializer.js';

console.log('Module dependencies loaded:', {
    mapInitializer: !!mapInitializer,
    leaflet: typeof L !== 'undefined'
});

document.addEventListener("DOMContentLoaded", function() {
    console.group('Map Initialization');
    console.log('DOM fully loaded and parsed');
    
    try {
        // Check critical dependencies
        if (typeof L === 'undefined') {
            console.error('Leaflet library is not loaded!');
            return;
        }

        // Verify map container exists
        const mapContainer = document.getElementById('leafletMap');
        if (!mapContainer) {
            console.error('Map container #leafletMap not found in the DOM!');
            return;
        }

        // Log container details
        console.log('Map container details:', {
            width: mapContainer.offsetWidth,
            height: mapContainer.offsetHeight,
            computedStyle: window.getComputedStyle(mapContainer)
        });

        // Initialize map
        mapInitializer.init();
        console.log('Map initialization complete');
    } catch (error) {
        console.error('Catastrophic map initialization failure:', error);
    } finally {
        console.groupEnd();
    }
});

// Expose global error handler for additional insight
window.addEventListener('error', function(event) {
    console.error('Unhandled error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});