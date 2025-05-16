document.addEventListener('DOMContentLoaded', function() {
    // Ensure map is initialized from theme.js
    const map = window.themeMap;
    if (!map) {
        console.error('Map not initialized in theme.js');
        return;
    }

    let marker = null;
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const selectedLocationText = document.getElementById('selectedLocation');
    const searchInput = document.getElementById('searchAddress');
    const searchButton = document.getElementById('searchButton');
    const prioritySelect = document.getElementById('priority');
    const taskForm = document.getElementById('taskForm');

    // Ensure elements exist before proceeding
    if (!latitudeInput || !longitudeInput || !taskForm) {
        console.error('Required form elements not found!');
        return;
    }

    // Custom marker icons for different priorities
    const markerIcons = {
        blue: L.icon({ iconUrl: '/static/images/marker-icon-blue.png', shadowUrl: '/static/images/marker-shadow.png' }),
        purple: L.icon({ iconUrl: '/static/images/marker-icon-purple.png', shadowUrl: '/static/images/marker-shadow.png' }),
        green: L.icon({ iconUrl: '/static/images/marker-icon-green.png', shadowUrl: '/static/images/marker-shadow.png' }),
        yellow: L.icon({ iconUrl: '/static/images/marker-icon-yellow.png', shadowUrl: '/static/images/marker-shadow.png' }),
        red: L.icon({ iconUrl: '/static/images/marker-icon-red.png', shadowUrl: '/static/images/marker-shadow.png' })
    };

    // Handle priority change safely
    if (prioritySelect) {
        prioritySelect.addEventListener('change', function() {
            if (marker) {
                const newIcon = markerIcons[this.value] || markerIcons.blue;
                marker.setIcon(newIcon);
            }
        });
    }

    // Handle map clicks
    map.on('click', function(e) {
        console.log('Map clicked at:', e.latlng);
        setMarker(e.latlng);
    });

    // Set marker with safety checks
    function setMarker(latlng) {
        if (!map) return;

        if (marker) {
            map.removeLayer(marker);
        }

        const priority = prioritySelect ? prioritySelect.value : 'blue';
        marker = L.marker(latlng, { icon: markerIcons[priority] || markerIcons.blue }).addTo(map);

        if (latitudeInput && longitudeInput) {
            latitudeInput.value = latlng.lat.toFixed(6);
            longitudeInput.value = latlng.lng.toFixed(6);
        }

        marker.bindPopup(`
            <div class="p-2">
                <strong>Selected Location</strong><br>
                Lat: ${latlng.lat.toFixed(6)}<br>
                Lng: ${latlng.lng.toFixed(6)}
            </div>
        `).openPopup();
    }

    // Handle form submission with safety check
    taskForm.addEventListener('submit', function(e) {
        if (!latitudeInput.value || !longitudeInput.value) {
            e.preventDefault();
            alert('Please select a location on the map');
        }
    });

    // Safe address search handling
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', searchAddress);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchAddress();
            }
        });
    }

    // Function to search for address
    function searchAddress() {
        if (!searchInput || !searchInput.value) return;

        const address = searchInput.value;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const location = data[0];
                    const latlng = { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
                    setMarker(latlng);
                    map.setView(latlng, 15);
                } else {
                    alert('Address not found');
                }
            })
            .catch(error => {
                console.error('Error searching address:', error);
                alert('Error searching for address');
            });
    }
});
