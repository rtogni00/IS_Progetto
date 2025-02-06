import config from "./config.js";

const url = config.apiUrl;

// Function to check if the user is logged in and retrieve their profile info
async function loadUserProfile() {
    const token = localStorage.getItem('token');  // Use the correct key for the token

    // console.log('Token from localStorage:', token); // Log the token to check if it's retrieved correctly

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${url}/api/v1/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('User Data:', data.user);  // Log the user object
            const user = data.user;
            document.getElementById('username-text').textContent = user.username;
            document.getElementById('email-text').textContent = user.email;

                // Check the user role and conditionally display buttons
            if (user.role === 'owner') {
                document.getElementById('my-button').innerHTML = `<a href="myPlaces.html" class="block text-blue-500 hover:text-blue-600">My Places</a>`;
                document.getElementById('new-button').innerHTML = `<a href="newPlace.html" class="block text-blue-500 hover:text-blue-600">New Place</a>`;
            } else if (user.role === 'organizer') {
                document.getElementById('my-button').innerHTML = `<a href="myEvents.html" class="block text-blue-500 hover:text-blue-600">My Events</a>`;
                document.getElementById('new-button').innerHTML = `<a href="newEventPage.html" class="block text-blue-500 hover:text-blue-600">New Event</a>`;
            } else {
                console.log("Regular user, no special buttons available.")
            }

        } else {
            console.log('Invalid token response:', response);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }

        // Fetch Saved Events
        const savedEventsResponse = await fetch(`${url}/api/v1/users/savedEvents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (savedEventsResponse.ok) {
            const { events } = await savedEventsResponse.json();
            const savedEventsList = document.getElementById('saved-events');
            savedEventsList.innerHTML = events.length > 0 ?
                events.map(event => `<li><a href="eventDetails.html?eventId=${event._id}" class="text-blue-500 hover:text-blue-600">${event.name}</a></li>`).join('')
                : '<li class="text-gray-500">No saved events.</li>';
        }

        // Fetch Enrolled Events
        const enrolledEventsResponse = await fetch(`${url}/api/v1/users/enrolledEvents`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (enrolledEventsResponse.ok) {
            const { events } = await enrolledEventsResponse.json();
            const enrolledEventsList = document.getElementById('enrolled-events');
            enrolledEventsList.innerHTML = events.length > 0 ?
                events.map(event => `<li><a href="eventDetails.html?eventId=${event._id}" class="text-blue-500 hover:text-blue-600">${event.name}</a></li>`).join('')
                : '<li class="text-gray-500">No enrolled events.</li>';
        }

    } catch (error) {
        console.error('Error loading user profile:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}
// Log out function
    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token'); // Remove token
        window.location.href = '../index.html'; // Redirect to login page
    });

// Load the user profile when the page loads
window.onload = loadUserProfile;
