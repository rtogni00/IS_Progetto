import config from "./config.js";

const url = config.apiUrl;

async function loginUser(event) {
    event.preventDefault();  // Prevent default form submission

    console.log('loginUser function triggered');
    console.log("API URL:", url);  // Log the API URL

    const form = document.getElementById('loginForm');
    const formData = new FormData(form);

    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
    };

    try {
        const response = await fetch(`${url}/api/v1/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log('Login Response: ', result);

        if (response.ok) {
            // If login is successful, store the token and redirect to the main page
            localStorage.setItem('token', result.token);  // Store the JWT token in localStorage

            // Wait a moment to ensure localStorage is updated before redirecting
            setTimeout(() => {
                window.location.href = '../pages/mainPageAfterLogin.html';
            }, 1000);  // Delay before redirecting, just in case
        } else {
            alert(result.message || 'Invalid login credentials');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred while logging in. Please try again.');
    }
}

// Attach event listener after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', loginUser);

    // Add the toggle password visibility functionality
    const eyeIcon = document.getElementById('eyeIcon');
    eyeIcon.addEventListener('click', togglePasswordVisibility);
});

// Function to toggle password visibility and switch the eye icon
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    // Toggle the input type between "password" and "text"
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';  // Show password
        eyeIcon.classList.remove('fa-eye');  // Remove the eye icon (closed)
        eyeIcon.classList.add('fa-eye-slash');  // Add the eye-slash icon (visible)
    } else {
        passwordInput.type = 'password';  // Hide password
        eyeIcon.classList.remove('fa-eye-slash');  // Remove the eye-slash icon
        eyeIcon.classList.add('fa-eye');  // Add the eye icon (hidden)
    }
}
