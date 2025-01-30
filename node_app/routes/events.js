const express = require('express');
const router = express.Router();
const EventModel = require('../models/event');
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

// Route to register a user for an event
router.post('/:eventId/enroll', tokenChecker, async (req, res) => {
    const userId = req.loggedUser._id;  // Access the user ID from the decoded token
    const eventId = req.params.eventId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the event
        const event = await EventModel.findById(eventId).session(session);
        if (!event) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the event has available capacity
        if (event.capacity && event.participants >= event.capacity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Event is fully booked' });
        }

        // Check if the user is already enrolled (active or cancelled)
        const existingRegistration = await EventRegistrationModel.findOne({
            event: eventId,
            user: userId,
        }).session(session);

        if (existingRegistration && existingRegistration.status === 'registered') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'User is already enrolled in this event' });
        }

        // If the user has a cancelled registration, reactivate it
        if (existingRegistration && existingRegistration.status === 'cancelled') {
            existingRegistration.status = 'registered';
            await existingRegistration.save({ session });
        } else {
            // Create a new registration if not exists
            const newRegistration = new EventRegistrationModel({
                event: eventId,
                user: userId,
                status: 'registered',
            });
            await newRegistration.save({ session });
        }

        // Increment the participants count in the Event model
        event.participants += 1;
        await event.save({ session });

        // Add the user to the participants list
        event.enrolledUsers.push(userId);
        await event.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: 'Successfully registered for the event',
            registration: existingRegistration || newRegistration,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


// New route to check if the user is enrolled in the event
router.get('/:eventId/isEnrolled', tokenChecker, async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.loggedUser;  // loggedUser is populated via middleware

    // console.log("UserId:", userId);

    try {
        // Check if the user is enrolled in the event
        const existingRegistration = await EventRegistrationModel.findOne({
            event: eventId,
            user: userId._id
        });

        // Respond with whether the user is enrolled
        if (existingRegistration && existingRegistration.status == "registered") {
            return res.json({ isEnrolled: true });
        } else {
            return res.json({ isEnrolled: false });
        }
    } catch (error) {
        console.error('Error checking enrollment status:', error);
        res.status(500).json({ message: 'Error checking enrollment status' });
    }
});

// Route to unenroll from an event
router.post('/:eventId/unenroll', tokenChecker, async (req, res) => {
    const userId = req.loggedUser._id;  // Access the user ID from the decoded token
    const eventId = req.params.eventId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the registration for the user
        const registration = await EventRegistrationModel.findOne({ event: eventId, user: userId }).session(session);

        if (!registration) { // || registration.status === 'cancelled') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'User is not enrolled in the event' });
        }

        // Update the registration status to "cancelled"
        registration.status = 'cancelled';
        await registration.save({ session });

        // Find the event
        const event = await EventModel.findById(eventId).session(session);
        if (!event) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Event not found' });
        }

        // Subtract 1 from the number of participants
        if (event.participants > 0) {
            event.participants -= 1;
        }

        // Remove the user from the participants list (if you're storing a list of participants)
        const userIndex = event.enrolledUsers.indexOf(userId);
        if (userIndex !== -1) {
            event.enrolledUsers.splice(userIndex, 1);
        }

        // Save the event with updated participants count and list
        await event.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Successfully unenrolled from the event', registration });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error unenrolling user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});



// Route to get event participants
router.get('/:eventId/participants', async (req, res) => {
    try {
        const eventId = req.params.eventId;

        // Find registrations with "registered" status for the event
        const participants = await EventRegistrationModel.find({ event: eventId, status: 'registered' })
            .populate('user', 'username email'); // Populate user details if needed

        res.status(200).json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.post('/:eventId/save', tokenChecker, async (req, res) => {  // TODO check
    const { eventId } = req.params;
    const userId = req.loggedUser;

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

module.exports = router;
