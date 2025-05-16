document.addEventListener("DOMContentLoaded", function () {
    let map;
    let marker;
    let selectedTaskId = null;

    function initializeMap() {
        if (map) {
            map.remove();
        }

        map = L.map("map").setView([33.5731, -7.5898], 12); // Default to Casablanca

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
        }).addTo(map);

        map.locate({ setView: true, maxZoom: 16 });

        map.on("locationfound", function (e) {
            if (!marker) {
                marker = L.marker(e.latlng).addTo(map)
                    .bindPopup("Your Current Location")
                    .openPopup();
            }
        });

        map.on("click", function (e) {
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(map)
                .bindPopup("Selected Location")
                .openPopup();

            // Ensure the fields exist before updating them
            let latElement = document.getElementById("displayLatitude");
            let lngElement = document.getElementById("displayLongitude");
            let latInput = document.getElementById("latitude");
            let lngInput = document.getElementById("longitude");

            if (latElement && lngElement) {
                latElement.textContent = `Latitude: ${e.latlng.lat}`;
                lngElement.textContent = `Longitude: ${e.latlng.lng}`;
            }

            if (latInput && lngInput) {
                latInput.value = e.latlng.lat;
                lngInput.value = e.latlng.lng;
            }
        });
    }

    document.querySelectorAll(".select-location").forEach(button => {
        button.addEventListener("click", function () {
            selectedTaskId = this.getAttribute("data-task-id");

            if (!selectedTaskId) {
                alert("Task ID is missing!");
                return;
            }

            let modal = new bootstrap.Modal(document.getElementById("mapModal"));
            modal.show();

            setTimeout(() => {
                initializeMap();
            }, 500);
        });
    });

    document.getElementById("saveLocation").addEventListener("click", function () {
        if (!marker) {
            alert("Please select a location on the map.");
            return;
        }

        let latitude = document.getElementById("latitude").value;
        let longitude = document.getElementById("longitude").value;

        if (!selectedTaskId) {
            alert("Error: Task ID is missing!");
            return;
        }

        fetch(`/save-location/${selectedTaskId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ latitude: latitude, longitude: longitude }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Location saved successfully!");
                document.getElementById("mapModal").querySelector(".btn-close").click();
                location.reload(); // Refresh to update the location
            } else {
                alert("Failed to save location: " + data.error);
            }
        })
        .catch(error => {
            alert("An error occurred while saving the location.");
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            document.cookie.split(";").forEach(cookie => {
                let trimmedCookie = cookie.trim();
                if (trimmedCookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(trimmedCookie.substring(name.length + 1));
                }
            });
        }
        return cookieValue;
    }
});
