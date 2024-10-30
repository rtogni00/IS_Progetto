const express = require('express');
const router = express.Router();
const UserModel = require('../models/user')
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file


const SECRET = process.env.SUPER_SECRET;

// Signup route with jwt token
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if the user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
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
            return res.status(400).json({ message: 'Invalid email or password' });
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

module.exports = router;
