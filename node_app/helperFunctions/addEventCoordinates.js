require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const axios = require('axios');
const EventModel = require('../models/event'); // Adjust the path to your Event model
const dbURI = process.env.MONGODB_URI;

// Function to add a delay between requests (to avoid hitting rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to update missing coordinates
async function updateEventCoordinates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(dbURI);

        console.log('Connected to database.');
        // Find events missing latitude or longitude
        const events = await EventModel.find({
            $or: [{ latitude: { $exists: false } }, { longitude: { $exists: false } }]
        });

        if (events.length === 0) {
            console.log('No events found with missing coordinates.');
            return;
        }

        console.log(`Found ${events.length} events with missing coordinates.`);

        for (const event of events) {
            try {
                let locationQuery = `${event.location}, Trento`; // Default to Trento

                // Add Trento to the search if not already included
                if (!event.location.toLowerCase().includes('trento')) {
                    locationQuery = `${event.location}, Trento`;
                }

                console.log(`Fetching coordinates for: ${locationQuery}`);

                // Geocoding API request
                const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        q: locationQuery,
                        format: 'json',
                        limit: 1
                    }
                });

                if (geocodeResponse.data.length === 0) {
                    console.warn(`Could not find coordinates for location: ${event.location}`);
                    continue;
                }

                const { lat, lon } = geocodeResponse.data[0];
                event.latitude = parseFloat(lat);
                event.longitude = parseFloat(lon);

                // Save the updated event
                await event.save();
                console.log(`Updated coordinates for event: ${event.name}`);

                // Add a delay to avoid hitting rate limits
                await delay(1000);  // 1-second delay

            } catch (geocodeError) {
                console.error(`Error geocoding location for event ${event.name}:`, geocodeError.message);
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from database.');

    } catch (error) {
        console.error('Error updating events:', error);
    }
}


updateEventCoordinates();
