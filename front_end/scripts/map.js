import config from "./config.js";

const url = config.apiUrl;

document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map with Trento's coordinates
    const map = L.map('map').setView([46.0667, 11.1167], 13); // Trento coordinates

    // Add a tile layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch events and add markers to the map
    fetchEvents(map);
});

// Fetch event data from the backend and add markers
async function fetchEvents(map) {
    try {
        const response = await fetch(`${url}/api/v1/events?map=true`); // Use the correct API endpoint
        const events = await response.json();

        console.log('Fetched events:', events);


        // Ensure we got events back
        if (events.length === 0) {
            console.log('No events to display on the map.');
            return;
        }

        // Loop through each event and place a marker on the map
        events.forEach(event => {
            const { latitude, longitude, name } = event;

            // Add marker for each event
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(`<strong>${name}</strong><br>${event.location}`);
        });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}
