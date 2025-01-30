// Import required modules
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const mongoose = require('mongoose')
const routes = require('./index');
require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors'); // Import CORS

// Initialize express app
const testApp = express();

///////////////////////////////////////////////////////////////////////////////////////////
//                      CORS MIDDLEWARE SETUP (to allow Front-End Origin)
///////////////////////////////////////////////////////////////////////////////////////////

testApp.use(cors({
    // origin: 'http://localhost:3000', // Allow requests from frontend
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

///////////////////////////////////////////////////////////////////////////////////////////
//                      EXPRESS MIDDLEWARE SETUP + AUTHENTICATION ROUTING
///////////////////////////////////////////////////////////////////////////////////////////

testApp.use(express.json()); // Middleware to parse JSON request bodies
testApp.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// app.use('/api/v1/authentications', routes.authentication);

///////////////////////////////////////////////////////////////////////////////////////////
//                      RESOURCE ROUTING
///////////////////////////////////////////////////////////////////////////////////////////

// Using routes from index.js for modularity


testApp.use('/api/v1/users', routes.usersRoute);
testApp.use('/api/v1/events', routes.eventsRoute);
testApp.use('/api/v1/places', routes.placesRoute);


module.exports = testApp;
