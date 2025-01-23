const express = require('express');
const router = express.Router();
const EventModel = require('../models/event');
const tokenChecker = require('../tokenChecker');


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
router.post('/create', tokenChecker, async (req, res) => {
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

//////////////////////////////////////////////////// TODO TEST

// Route to register a user for an event
router.post('/:eventId/register', tokenChecker, async (req, res) => {
    const { eventId } = req.params;

    try {
        // Extract the user ID from the decoded token
        const userId = req.loggedUser.id; // Assuming the token contains a field `id` for the user

        // Check if event exists
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the event has capacity
        const registrationsCount = await EventRegistrationModel.countDocuments({ event: eventId });
        if (event.capacity && registrationsCount >= event.capacity) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if user is already registered
        const existingRegistration = await EventRegistrationModel.findOne({ event: eventId, user: userId });
        if (existingRegistration) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // Register user for the event
        const newRegistration = new EventRegistrationModel({
            event: eventId,
            user: userId,
            status: 'registered'
        });

        await newRegistration.save();

        res.status(200).json({ message: 'Successfully registered for the event' });
    } catch (error) {
        console.error('Error during event registration:', error);
        res.status(500).json({ message: 'Error during registration', error });
    }
});

router.post('/:eventId/save', tokenChecker, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.loggedUser.id;

    try {
        // Ensure the event exists
        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Add the event to the user's saved events
        await UserModel.findByIdAndUpdate(userId, { $addToSet: { savedEvents: eventId } });

        res.status(200).json({ message: 'Event saved successfully' });
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ message: 'Error saving event', error });
    }
});

router.post('/:eventId/markPast', tokenChecker, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.loggedUser.id;

    try {
        // Ensure the event exists
        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if the event date has passed
        if (new Date(event.date) > new Date()) {
            return res.status(400).json({ message: 'Event has not yet ended' });
        }

        // Add the event to the user's past events
        await UserModel.findByIdAndUpdate(userId, { $addToSet: { pastEvents: eventId } });

        res.status(200).json({ message: 'Event marked as past' });
    } catch (error) {
        console.error('Error marking event as past:', error);
        res.status(500).json({ message: 'Error marking event as past', error });
    }
});


///////////////////////////////// UP HERE

module.exports = router;
