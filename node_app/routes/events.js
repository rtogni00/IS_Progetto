const express = require('express');
const router = express.Router();
const EventModel = require('../models/event');

// Route to get events by optional query parameters (name, date, location)
router.get('/', async (req, res) => {
    try {
        const { name, date, location } = req.query; // Destructure query parameters

        // Build filter object
        const filter = {};
        if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match
        if (place) filter.place = { $regex: place, $options: 'i' };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const events = await EventModel.find(filter);

        if (events.length === 0) {
            return res.status(200).json({ message: 'No events found', events: [] });
        }
        
        res.status(200).json(events); // Return the found events
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events', error });
    }
});

// Route to fetch a single event by its ID
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await EventModel.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event', error });
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
