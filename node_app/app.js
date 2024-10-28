const express = require('express');
const mongoose = require('mongoose')
const routes = require('./index');
require('dotenv').config(); // Load environment variables from .env file
// console.log(process.env)

const app = express();
const port = 5000;

// Database connection with mongoose
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));



app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// Using routes from index.js for modularity
app.use('/api/v1/users', routes.usersRoute);
app.use('/api/v1/events', routes.eventsRoute);
app.use('/api/v1/places', routes.placesRoute);


app.listen(port, function() { // starts Express server 
    console.log('Server running on port ', port);
});



