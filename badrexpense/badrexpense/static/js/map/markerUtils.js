// markerUtils.js
export const markerUtils = {
 
    createMarkerIcons() {
        try {
            return {
                'unassigned': this.createMarkerIcon('gray') || new L.Icon.Default(),
                'assigned': this.createMarkerIcon('blue') || new L.Icon.Default(),
                'in-transit': this.createMarkerIcon('orange') || new L.Icon.Default(),
                'succeeded': this.createMarkerIcon('green') || new L.Icon.Default(),
                'failed': this.createMarkerIcon('red') || new L.Icon.Default(),
                'default': new L.Icon.Default()
            };
        } catch (error) {
            console.error('Error creating marker icons:', error);
            // Return an object with default icons
            return {
                'unassigned': new L.Icon.Default(),
                'assigned': new L.Icon.Default(),
                'in-transit': new L.Icon.Default(),
                'succeeded': new L.Icon.Default(),
                'failed': new L.Icon.Default(),
                'default': new L.Icon.Default()
            };
        }
    },

    createMarkerPopupContent(task) {
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
    },
// markerUtils.js - update the createMarkerIcon function
    createMarkerIcon(color) {
        try {
            // Use Leaflet's built-in icon API properly
            return L.icon({
                iconUrl: `/static/images/marker-icon-${color}.png`,
                shadowUrl: '/static/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        } catch (error) {
            console.error('Failed to create custom icon:', error);
            // Return Leaflet default icon
            return L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        }
    },
};