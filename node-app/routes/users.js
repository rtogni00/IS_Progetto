const express = require('express');
const router = express.Router();

// Signup route
router.post('/signup', (req, res) => {
    // TODO Handle user signup
    // Send a basic response to test the route
    res.status(201).json({ message: 'User signup route hit successfully!' });
});

// Login route
router.post('/login', (req, res) => {
    // TODO Handle user login and JWT creation
    // Send a basic response to test the route
    res.status(200).json({ message: 'User login route hit successfully!' });
});

module.exports = router;
