import config from "./config.js";

const url = config.apiUrl;

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners after the DOM is fully loaded
    document.getElementById('searchByName').addEventListener('input', applyFilters);
    document.getElementById('searchByLocation').addEventListener('input', applyFilters);
    document.getElementById('date').addEventListener('input', applyFilters);
    
    // Attach event listeners for buttons
    document.getElementById('backToMainPage').addEventListener('click', goToMainPage);
    document.getElementById('searchButton').addEventListener('click', applyFilters);
    document.getElementById('clearButton').addEventListener('click', clearFilters);

    // Fetch events when the page loads
    fetchEvents();
});

// Fetch events with optional filters
async function fetchEvents(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${url}/api/v1/events?${queryParams}`, {
            method: 'GET',
        });

        const events = await response.json();
        if (response.ok) {
            displayEvents(events);
        } else {
            alert(events.message || 'Failed to fetch events');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Display events on the page
function displayEvents(events) {
    const eventListContainer = document.getElementById('eventList');
    eventListContainer.innerHTML = ''; // Clear the container

    if (events.length === 0) {
        eventListContainer.innerHTML = '<p class="text-gray-500">No events found.</p>';
        return;
    }

    events.forEach(event => {
        const eventBox = document.createElement('div');
        eventBox.className = 'event-box p-4 border rounded shadow-sm bg-white';
        eventBox.innerHTML = `
            <h3 class="font-bold text-lg">${event.name}</h3>
            <p>Place: ${event.location}</p>
            <p>Date: ${new Date(event.date).toLocaleString()}</p>
            <button onclick="showEventDetails('${event._id}')" 
                class="mt-2 text-blue-500 underline">View Details</button>
        `;
        eventListContainer.appendChild(eventBox);
    });
}

// Show full details of a specific event (expand on click)
async function showEventDetails(eventId) {
    window.location.href = `eventDetails.html?eventId=${eventId}`;
}

// Expose the function globally so inline onclick works
window.showEventDetails = showEventDetails;

// Apply filters and fetch events
function applyFilters() {
    const name = document.getElementById('searchByName').value;
    const location = document.getElementById('searchByLocation').value;
    const date = document.getElementById('date').value;

    const filters = {};
    if (name) filters.name = name;
    if (location) filters.location = location;
    if (date) filters.date = date;

    fetchEvents(filters);
}

// Function to clear the filters
function clearFilters() {
    // Clear the values of the search fields
    document.getElementById('searchByName').value = '';
    document.getElementById('searchByLocation').value = '';
    document.getElementById('date').value = '';

    // Reset the filters and fetch all events
    fetchEvents();
}

// Fetch events on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
});

// Navigate to the main page
function goToMainPage() {
    window.location.href = 'mainPageAfterLogin.html'; // Adjust the URL to match the main page route
}
