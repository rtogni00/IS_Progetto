require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');

// Load the Event model
const Event = require('../models/event'); // Adjust the path if needed

const dbURI = process.env.MONGODB_URI;

async function listAllEvents() {
    try {
        // Connect to MongoDB
        await mongoose.connect(dbURI);
        console.log('Connected to database.');

        // Fetch all events from the database
        const events = await Event.find({}); // Fetch all documents in the "events" collection

        // Check if there are events to display
        if (events.length === 0) {
            console.log('No events found in the database.');
        } else {
            console.log('Events in the database:');
            events.forEach((event, index) => {
                console.log(`\nEvent ${index + 1}:`);
                console.log(`Name: ${event.name}`);
                console.log(`Description: ${event.description}`);
                console.log(`Date: ${new Date(event.date).toLocaleString()}`);
                console.log(`Location: ${event.location}`);
                console.log(`Capacity: ${event.capacity}`);
                console.log(`Participants: ${event.participants}`);
                console.log(`Organizer: ${event.organizer}`);
                console.log(`Enrolled Users: ${event.enrolledUsers}`);
                console.log(`Pictures: ${event.pictures.join(', ')}`);
            });
        }

        // Disconnect from the database
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Call the function to list all events
listAllEvents();
