// const url = "http://localhost:5000";
const url = "https://is-progetto.onrender.com";

// Extract eventId from the URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('eventId');

// Get the user token from localStorage (assumes the token is stored there)
const token = localStorage.getItem('token');

if (!token) {
    console.error("No token found, user not logged in.");
    alert("You need to log in first.");
    window.location.href = "login.html";  // Redirect to login page
}

// Fetch event details and update the UI
async function loadEventDetails() {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const event = await response.json();

            // Populate event details
            document.getElementById('event-name').textContent = event.name;
            document.getElementById('event-location').textContent = event.location;
            document.getElementById('event-date').textContent = new Date(event.date).toLocaleString();
            document.getElementById('event-description').textContent = event.description;
            document.getElementById('event-capacity').textContent = event.capacity;
            document.getElementById('event-enrolled').textContent = event.enrolledUsers.length;

            // Check if the user is already enrolled
            const isEnrolled = await isUserEnrolled(eventId, token);
            // alert(isEnrolled);

            // Set the enroll/unenroll button state
            const enrollButton = document.getElementById('enroll-button');
            if (isEnrolled) {
                enrollButton.textContent = "Unenroll";
                enrollButton.className = "bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700";
                enrollButton.onclick = () => unenrollFromEvent(eventId);
            } else {
                enrollButton.textContent = "Enroll";
                enrollButton.className = "bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700";
                enrollButton.onclick = () => enrollInEvent(eventId);
            }

            const isSaved = await isEventSaved(eventId, token);
            // Set the save/unsave button state
            const saveButton = document.getElementById('save-button');
            if (isSaved) {
                saveButton.innerHTML = `<i class="fa-solid fa-bookmark"></i> Saved`;
                saveButton.className = "bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700";
                saveButton.onclick = () => unsaveEvent(eventId);
            } else {
                saveButton.innerHTML = `<i class="fa-regular fa-bookmark"></i> Save Event`;
                saveButton.className = "bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600";
                saveButton.onclick = () => saveEvent(eventId);
            }

            // Populate pictures
            const picturesDiv = document.getElementById('event-pictures');
            event.pictures.forEach(picture => {
                const img = document.createElement('img');
                img.src = `http://localhost:5000/uploads/${picture}`;
                img.alt = `Picture of ${event.name}`;
                img.className = "w-40 h-40 object-cover rounded-lg shadow-md";
                picturesDiv.appendChild(img);
            });
        } else {
            console.error('Failed to fetch event details');
            document.body.innerHTML = `<p class="text-center text-red-600 mt-10">Error loading event details. Please try again later.</p>`;
        }
    } catch (error) {
        console.error('Error fetching event details:', error);
        document.body.innerHTML = `<p class="text-center text-red-600 mt-10">Error loading event details. Please try again later.</p>`;
    }
}

// Check if the user has saved this event
async function isEventSaved(eventId, token) {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}/isSaved`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Saved event status response:', data);

        return data.isSaved; // true or false based on saved status
    } catch (error) {
        console.error('Error checking saved status:', error);
        return false;
    }
}

    // Check if the user is enrolled in the event
    async function isUserEnrolled(eventId, token) {
        try {
            const response = await fetch(`${url}/api/v1/events/${eventId}/isEnrolled`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Enrollment status response:', data);

            return data.isEnrolled; // true or false based on user enrollment status
        } catch (error) {
            console.error('Error checking enrollment status:', error);
            return false;
        }
    }


// Save an event
async function saveEvent(eventId) {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}/save`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Event saved successfully!');
            location.reload(); // Reload to update the button state
        } else {
            const errorData = await response.json();
            alert(`Failed to save event: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event. Please try again.');
    }
}

// Unsave an event
async function unsaveEvent(eventId) {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}/unsave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Event removed from saved list.');
            location.reload(); // Reload to update the button state
        } else {
            const errorData = await response.json();
            alert(`Failed to unsave event: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error unsaving event:', error);
        alert('Error removing event. Please try again.');
    }
}

// Enroll in event
async function enrollInEvent(eventId) {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Successfully enrolled!');
            location.reload();  // Reload the page to update the button and event details
        } else {
            const errorData = await response.json();
            alert(`Failed to enroll: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error enrolling in event:', error);
        alert('Error enrolling. Please try again.');
    }
}

// Unenroll from event
async function unenrollFromEvent(eventId) {
    try {
        const response = await fetch(`${url}/api/v1/events/${eventId}/unenroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Successfully unenrolled!');
            location.reload();  // Reload the page to update the button and event details
        } else {
            alert('Failed to unenroll. Please try again.');
        }
    } catch (error) {
        console.error('Error unenrolling from event:', error);
        alert('Error unenrolling. Please try again.');
    }
}

// Load event details on page load
loadEventDetails();
