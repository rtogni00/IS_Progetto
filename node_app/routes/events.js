const express = require('express');
const router = express.Router();
const EventModel = require('../models/event');
const UserModel = require('../models/user');
const EventRegistrationModel = require('../models/eventRegistration');
const tokenChecker = require('../tokenChecker');
const axios = require('axios'); // for geocoding
var mongoose = require('mongoose');


// Route to get events by optional query parameters (name, date, location)
router.get('/', async (req, res) => {
    try {
        const { name, location, date, map} = req.query; // Destructure query parameters

        // Build filter object
        const filter = {};
        if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match
        if (location) filter.location = { $regex: location, $options: 'i' };
        // if (startDate || endDate) {
        //     filter.date = {};
        //     if (startDate) filter.date.$gte = new Date(startDate);
        //     if (endDate) filter.date.$lte = new Date(endDate);
        // }

        if (date) {
            // Convert date to a valid Date object
            const targetDate = new Date(date);
            filter.date = { $gte: targetDate, $lt: new Date(targetDate).setDate(targetDate.getDate() + 1) }; // Match events within that date
        }

        // Debugging logs
        // console.log('Query parameters:', { name, location, date });
        // console.log('Filter object:', filter);
        // If map=true, only select name, location, and coordinates
        const eventFields = map === 'true' ? 'name location latitude longitude' : '';
        let events = await EventModel.find(filter).select(eventFields);

        // If map=true and event has no coordinates, fetch coordinates using geocoding
        if (map === 'true') {
            for (let event of events) {
                if (!event.latitude || !event.longitude) {
                    try {
                        let locationQuery = `${event.location}, Trento`; // Default to Trento

                        // Check if location contains "Trento", and avoid adding it again to the query
                        if (!event.location.toLowerCase().includes('trento')) {
                            locationQuery = `${event.location}, Trento`; // Add Trento to the search
                        }

                        console.log(`Fetching coordinates for: ${locationQuery}`);

                        const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
                            params: {
                                q: locationQuery,
                                format: 'json',
                                limit: 1
                            }
                        });

                        if (geocodeResponse.data.length > 0) {
                            const { lat, lon } = geocodeResponse.data[0];
                            // Double-check if it is within Trento's bounding box
                            if (lat > 45.5 && lat < 46.2 && lon > 10.9 && lon < 11.2) {  // Rough bounds for Trento
                                event.latitude = parseFloat(lat);
                                event.longitude = parseFloat(lon);
                                await event.save(); // Save the updated event with coordinates
                                console.log(`Updated event: ${event.name}`);
                            } else {
                                console.warn(`Coordinates for ${event.name} are outside of Trento bounds.`);
                            }
                        } else {
                            console.warn(`Could not find coordinates for location: ${event.location}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching coordinates for ${event.name}:`, error.message);
                    }
                }
            }
        }

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
// router.post('/create', tokenChecker, async (req, res) => {
//     try {
//         const newEvent = new EventModel(req.body);
//         const savedEvent = await newEvent.save();
//         res.status(201).json(savedEvent);
//         console.log("Event created successfully");
//     } catch (error) {
//         console.error('Error creating event:', error);  // Log the error details for debugging
//         res.status(500).json({ message: 'Error creating event', error });
//     }
// });

router.post('/create', tokenChecker, async (req, res) => {
    try {
        const { location, ...eventData } = req.body;

        // Geocode the location
        const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: location,
                format: 'json',
                limit: 1
            }
        });

        if (geocodeResponse.data.length === 0) {
            return res.status(400).json({ message: `Could not find coordinates for location: ${location}` });
        }

        const { lat, lon } = geocodeResponse.data[0];

        // Add coordinates to event data
        const newEvent = new EventModel({
            ...eventData,
            location,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
        });

        // Save the new event
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
        // console.log("Event created successfully with coordinates:", { latitude: lat, longitude: lon });
    } catch (error) {
        // console.error('Error creating event:', error);  // Log the error details for debugging
        res.status(500).json({ message: 'Error creating event', error });
    }
});

router.post('/:eventId/enroll', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id);
        const event = await EventModel.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.enrolledUsers.includes(user._id)) {
            return res.status(400).json({ message: 'User already enrolled' });
        }

        // Add event to user's enrolledEvents
        user.enrolledEvents.push(event._id);
        await user.save();

        // Add user to event's enrolledUsers and update participants count
        event.enrolledUsers.push(user._id);
        event.participants = event.enrolledUsers.length;
        await event.save();

        res.json({ message: 'Enrolled successfully' });
    } catch (error) {
        console.error('Error enrolling user:', error);
        res.status(500).json({ message: 'Error enrolling user' });
    }
});



// New route to check if the user is enrolled in the event\
router.get('/:eventId/isEnrolled', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id);
        const isEnrolled = user.enrolledEvents.includes(req.params.eventId);
        res.json({ isEnrolled });
    } catch (error) {
        console.error('Error checking enrollment status:', error);
        res.status(500).json({ message: 'Error checking enrollment status' });
    }
});

router.post('/:eventId/unenroll', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id);
        const event = await EventModel.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.enrolledUsers.includes(user._id)) {
            return res.status(400).json({ message: 'User is not enrolled' });
        }

        // Remove event from user's enrolledEvents
        user.enrolledEvents = user.enrolledEvents.filter(eventId => eventId.toString() !== event._id.toString());
        await user.save();

        // Remove user from event's enrolledUsers and update participants count
        event.enrolledUsers = event.enrolledUsers.filter(userId => userId.toString() !== user._id.toString());
        event.participants = event.enrolledUsers.length;
        await event.save();

        res.json({ message: 'Unenrolled successfully' });
    } catch (error) {
        console.error('Error unenrolling user:', error);
        res.status(500).json({ message: 'Error unenrolling user' });
    }
});

router.get('/:eventId/participants', async (req, res) => {
    try {
        const event = await EventModel.findById(req.params.eventId)
            .populate('enrolledUsers', 'username email'); // Populate user details if needed

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ participants: event.enrolledUsers });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/:eventId/markPast', tokenChecker, async (req, res) => { // TODO check
    const { eventId } = req.params;
    const userId = req.loggedUser;

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

router.post('/:eventId/save', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id);
        if (!user.savedEvents.includes(req.params.eventId)) {
            user.savedEvents.push(req.params.eventId);
            await user.save();
        }
        res.json({ message: 'Event saved successfully' });
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ message: 'Error saving event' });
    }
});

router.get('/:eventId/isSaved', tokenChecker, async (req, res) => {
    try {
        const user = await UserModel.findById(req.loggedUser._id);
        const isSaved = user.savedEvents.includes(req.params.eventId);
        res.json({ isSaved });
    } catch (error) {
        console.error('Error checking saved event status:', error);
        res.status(500).json({ message: 'Error checking saved event status' });
    }
});

// Unsave an event
router.post('/:eventId/unsave', tokenChecker, async (req, res) => {
    try {
        const userId = req.loggedUser._id; // Extract user ID from token
        const eventId = req.params.eventId;

        // Find the user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the event is in savedEvents
        if (!user.savedEvents.includes(eventId)) {
            return res.status(400).json({ message: "Event is not saved" });
        }

        // Remove event from savedEvents
        user.savedEvents = user.savedEvents.filter(id => id.toString() !== eventId);
        await user.save();

        res.json({ message: "Event unsaved successfully" });
    } catch (error) {
        console.error("Error unsaving event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
