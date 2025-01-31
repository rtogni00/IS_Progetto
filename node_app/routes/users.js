const express = require('express');
const router = express.Router();
const UserModel = require('../models/user')
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file
const tokenChecker = require('../tokenChecker');


const SECRET = process.env.SUPER_SECRET;

// Signup route with jwt token
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if the email already exists
        const existingUserEmail = await UserModel.findOne({ email });
        if (existingUserEmail) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Check if the username is already taken
        const existingUserUsername = await UserModel.findOne({ username });
        if (existingUserUsername) {
            return res.status(400).json({ message: 'Username already in use' });
        }

        const allowedRoles = ['user', 'owner', 'organizer'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        // Create a new user
        const newUser = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body,password, // Save the password directly (not recommended for production)
            role: req.body.role
        });

        const savedUser = await newUser.save();

        // generate jwt token
        const token = jwt.sign({username: savedUser.username, password: savedUser.password}, SECRET);

        res.status(201).json({
            message: 'User created successfully', 
            user: savedUser,
            token: token
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Error during signup', error: error.message });
    }
});

// login route with jwt token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await UserModel.findOne({ email });
        // Check if the password matches (direct comparison, not recommended for production)
        if (!user || user.password != password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        // generate jwt token
        const token = jwt.sign({_id: user._id, username: user.username, password: user.password, role: user.role}, SECRET);

        res.status(200).json({
            message: 'Login successful', 
            token: token
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
});

// Profile route that requires a valid token to access
router.get('/profile', tokenChecker, async (req, res) => {
  // If the token is valid, you can retrieve user info
    try {
    // Retrieve the user from the database using the user ID from the token
    const user = await UserModel.findById(req.loggedUser._id).select('username email role'); // Fetch user info, including email
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user data, including username, email, and role
    res.json({ message: 'Welcome to your profile', user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    // Invalidate JWT token
    req.session.destroy((err) => {
      if (err) throw err;
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Error during logout', error: error.message });
  }
});

module.exports = router;
