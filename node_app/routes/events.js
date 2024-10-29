const express = require('express');
const router = express.Router();
const EventModel = require('../models/event');

// Route to get events by optional query parameters (name, date, location)
router.get('/', async (req, res) => {
    try {
        const { name, date, location } = req.query; // Destructure query parameters

        // Build the query object based on provided parameters
        const query = {};
        if (name) query.name = name; // Add name filter if provided
        if (date) query.date = date; // Add date filter if provided
        if (location) query.location = location; // Add location filter if provided

        // Find events based on the constructed query
        const events = await EventModel.find(query);

        // Check if any events were found
        if (events.length === 0) {
            return res.status(404).json({ message: 'No events found matching the criteria.' });
        }

        res.status(200).json(events); // Return the found events
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events', error });
    }
});


// Route to create an event
router.post('/create', async (req, res) => {
    try {
        const newEvent = new EventModel(req.body);
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
        console.log("Event created successfully");
    } catch (error) {
        console.error('Error creating event:', error);  // Log the error details for debugging
        res.status(500).json({ message: 'Error creating event', error });
    }
});


module.exports = router;
