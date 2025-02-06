import config from "./config.js";

const url = config.apiUrl;

async function changePassword(event) {
    event.preventDefault();  // Prevent default form submission

    const form = document.getElementById('changePwdForm');
    const formData = new FormData(form);

    // Get the old and new passwords from the form
    const data = {
        oldPassword: formData.get('oldPassword'),
        newPassword: formData.get('newPassword'),
    };

    try {
        const response = await fetch(`${url}/api/v1/users/changePwd`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Add token for authentication
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Password updated successfully');
            window.location.href = 'userPersonalArea.html';
        } else {
            alert(result.message || 'Failed to update password');
        }
    } catch (error) {
        console.error('Error during password change:', error);
        alert('An error occurred while changing the password. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // console.log('Current hostname:', window.location.hostname);
    // console.log('Api url:', url);

    // Add event listener to form submit for password change
    const changePwdForm = document.getElementById('changePwdForm');
    changePwdForm.addEventListener('submit', changePassword);
    // Add the event listeners for both the old and new password eye icons
    const eyeIconOld = document.getElementById('eyeIconOld');
    const eyeIconNew = document.getElementById('eyeIconNew');

    eyeIconOld.addEventListener('click', () => togglePasswordVisibility('oldPassword', 'eyeIconOld'));
    eyeIconNew.addEventListener('click', () => togglePasswordVisibility('newPassword', 'eyeIconNew'));
});

// Function to toggle password visibility and switch the eye icon
function togglePasswordVisibility(passwordFieldId, eyeIconId) {
    const passwordInput = document.getElementById(passwordFieldId);
    const eyeIcon = document.getElementById(eyeIconId);

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

