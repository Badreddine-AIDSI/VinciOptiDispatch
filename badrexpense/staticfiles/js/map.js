document.addEventListener("DOMContentLoaded", function () {
    const map = L.map('map').setView([33.5731, -7.5898], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    let waypoints = [];
    let markers = [];
    let routingControl = null;
    let userMarker = null;
    let tracking = false;
    let currentStepIndex = 0;
    let routeInstructions = [];

    let startNavButton = document.getElementById("start-navigation");
    let directionsPanel = document.getElementById("directions-panel");
    let currentStepElement = document.getElementById("current-step");

    map.on('click', function (e) {
        if (waypoints.length < 4) {
            const marker = L.marker(e.latlng).addTo(map).bindPopup(`Order ${waypoints.length + 1}`).openPopup();
            markers.push(marker);
            waypoints.push(e.latlng);
            if (waypoints.length === 4) {
                updateRoute(waypoints);
                startNavButton.style.display = "block"; // Show start button
            }
        } else {
            alert("You can only select 4 locations.");
        }
    });

    startNavButton.addEventListener("click", function() {
        navigator.geolocation.getCurrentPosition(position => {
            const userLocation = L.latLng(position.coords.latitude, position.coords.longitude);
            waypoints.unshift(userLocation);
            updateRoute(waypoints, true);
        }, () => {
            alert("Unable to retrieve your location.");
        });
    });

    function updateRoute(waypoints, startNavigation = false) {
        if (routingControl) {
            map.removeControl(routingControl);
        }
        routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            showAlternatives: false,
            routeLine: function(route) { return L.polyline(route.coordinates, { color: 'blue', opacity: 0.7, weight: 5 }); },
            createMarker: function() { return null; }
        }).addTo(map);

        routingControl.on('routesfound', function (e) {
            routeInstructions = e.routes[0].instructions; // Get turn-by-turn instructions
            currentStepIndex = 0;
            if (startNavigation) {
                startTracking();
            }
        });
    }

    function startTracking() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        tracking = true;
        directionsPanel.style.display = "block";
        updateCurrentStep();

        navigator.geolocation.watchPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const userLatLng = L.latLng(lat, lng);

            if (!userMarker) {
                userMarker = L.marker(userLatLng, {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        iconSize: [40, 40]
                    })
                }).addTo(map);
            } else {
                userMarker.setLatLng(userLatLng);
            }

            map.setView(userLatLng, 16); // Auto zoom and pan

            // Check if the user reached the next step
            if (currentStepIndex < routeInstructions.length) {
                let nextStep = L.latLng(routeInstructions[currentStepIndex].lat, routeInstructions[currentStepIndex].lng);
                if (userLatLng.distanceTo(nextStep) < 50) { // If user is within 50m of the next step
                    currentStepIndex++;
                    updateCurrentStep();
                }
            }
        }, error => {
            alert("Unable to track your location.");
        }, {
            enableHighAccuracy: true,
            maximumAge: 0
        });
    }

    function updateCurrentStep() {
        if (currentStepIndex < routeInstructions.length) {
            currentStepElement.innerHTML = `<b>${routeInstructions[currentStepIndex].text}</b>`;
        } else {
            currentStepElement.innerHTML = "You have reached your destination!";
        }
    }

    document.getElementById("reset").addEventListener("click", function () {
        waypoints = [];
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        if (routingControl) {
            map.removeControl(routingControl);
        }
        directionsPanel.style.display = "none";
        startNavButton.style.display = "none";
        currentStepElement.innerHTML = "Click 'Start Navigation' to begin.";
    });
});
