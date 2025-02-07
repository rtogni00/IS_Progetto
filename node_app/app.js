// Import required modules
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const mongoose = require('mongoose')
const routes = require('./index');
require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors'); // Import CORS

// Initialize express app
const app = express();
const port = 5000;

///////////////////////////////////////////////////////////////////////////////////////////
//                      DATABASE CONNECTION
///////////////////////////////////////////////////////////////////////////////////////////

// Define the MongoDB URI, retrieved from the .env file
const dbURI = process.env.MONGODB_URI;

async function connectDB() {
    try {
        const conn = await mongoose.connect(dbURI, {});
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error(error.message);
    }
}
connectDB();


///////////////////////////////////////////////////////////////////////////////////////////
//                      CORS MIDDLEWARE SETUP (to allow Front-End Origin)
///////////////////////////////////////////////////////////////////////////////////////////

app.use(cors({
    // origin: 'http://localhost:3000', // Allow requests from frontend
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

///////////////////////////////////////////////////////////////////////////////////////////
//                      EXPRESS MIDDLEWARE SETUP + AUTHENTICATION ROUTING
///////////////////////////////////////////////////////////////////////////////////////////

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// app.use('/api/v1/authentications', routes.authentication);

///////////////////////////////////////////////////////////////////////////////////////////
//                      RESOURCE ROUTING
///////////////////////////////////////////////////////////////////////////////////////////

// Using routes from index.js for modularity


app.use('/api/v1/users', routes.usersRoute);
app.use('/api/v1/events', routes.eventsRoute);
app.use('/api/v1/places', routes.placesRoute);

///////////////////////////////////////////////////////////////////////////////////////////
//                      SERVER LISTENER
///////////////////////////////////////////////////////////////////////////////////////////

app.listen(port, function () { // starts Express server 
    console.log('Server running on port ', port);
});



