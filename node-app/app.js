const express = require('express');
const routes = require('./index');

const app = express();
const port = 5000;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

// Using routes from index.js for modularity
app.use('/api/v1/users', routes.usersRoute);
app.use('/api/v1/events', routes.eventsRoute);
app.use('/api/v1/places', routes.placesRoute);


app.listen(port, function() { // starts Express server 
    console.log('Server running on port ', port);
});



