// const url = "http://localhost:5000";
const url = "https://is-progetto.onrender.com";

async function registerUser(event) {
    console.log('registerUser function triggered');
    event.preventDefault(); // Prevent the form from submitting normally

    const form = document.getElementById('registerForm');
    const formData = new FormData(form);

    const data = {
        email: formData.get('email'),
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role'),
    };

    try {
        const response = await fetch(`${url}/api/v1/users/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        // Check for response status
        const result = await response.json();

        if (response.ok) {
            // If signup is successful
            alert('Registration successful');
            window.location.href = "login.html"; // Redirect to login page
        } else {
            // Handle different error cases based on the message
            if (result.message === 'Email already in use') {
                alert('The email is already in use. Please choose another one.');
            } else if (result.message === 'Username already in use') {
                alert('The username is already in use. Please choose another one.');
            } else {
                alert('An error occurred during registration. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred while registering the user.');
    }
}

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


// Link the toggle function to the eye icon click event
document.getElementById('eyeIcon').addEventListener('click', togglePasswordVisibility);

// Link the register function to the form submission event
document.getElementById('registerForm').addEventListener('submit', registerUser);
