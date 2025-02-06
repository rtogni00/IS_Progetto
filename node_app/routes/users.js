const express = require('express');
const router = express.Router();
const UserModel = require('../models/user')
const jwt = require('jsonwebtoken');
const tokenChecker = require('../tokenChecker');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Define salt rounds for hashing
require('dotenv').config(); // Load environment variables from .env file



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

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role
        });

        const savedUser = await newUser.save();

        // generate jwt token
        const token = jwt.sign({_id: savedUser._id, username: savedUser.username, role: savedUser.role}, SECRET);

        res.status(201).json({
            message: 'User created successfully', 
            user: { username: savedUser.username, email: savedUser.email, role: savedUser.role }, // Do not return password
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
        if (!user) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        // Compare the hashed password in the database with the provided password
        const isPasswordValid = await bcrypt.compare(password, user.password);
         if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token, excluding the password from the payload
        const token = jwt.sign(
            { _id: user._id, username: user.username, role: user.role },
            SECRET,
            { expiresIn: '1h' } // Optional: Set token expiration for security
        );

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
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send the user data, including username, email, and role
    return res.status(200).json({
      success: true,
      message: 'Welcome to your profile',
      user: user
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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

// Get saved events
router.get('/savedEvents', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id).populate('savedEvents', 'name');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ events: user.savedEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get enrolled events
router.get('/enrolledEvents', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id).populate('enrolledEvents', 'name');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ events: user.enrolledEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

// Change password
router.post('/changePwd', tokenChecker, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.loggedUser._id; // We get the user ID from the tokenChecker middleware

        // Find the user by ID
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the old password matches
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Validate the new password (you can add more validation here)
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Return a success message
        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error during password change:', error);
        res.status(500).json({ message: 'Error during password change', error: error.message });
    }
});
