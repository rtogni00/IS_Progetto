// map.js
document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    const map = L.map('map').setView([46.0667, 11.1167], 13); // Trento coordinates

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch event data and add markers
    // fetchEvents(map);
});

async function fetchEvents(map) {
    try {
        const response = await fetch('/api/v1/events'); // Replace with your actual API endpoint
        const events = await response.json();

        // Add markers for events
        events.forEach(event => {
            const { latitude, longitude, name } = event;
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(`<strong>${name}</strong>`);
        });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}
