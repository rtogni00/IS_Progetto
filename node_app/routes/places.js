const express = require('express');
const router = express.Router();
const PlaceModel = require('../models/place'); // Import the Place model

// Route to get a place by its name
router.get('/:name', async (req, res) => {
    try {
        const placeName = req.params.name;
        const place = await PlaceModel.findOne({ name: placeName });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        res.status(200).json(place);
    } catch (error) {
        console.error('Error fetching place:', error);
        res.status(500).json({ message: 'Error fetching place', error });
    }
});

// Route to create a new place
router.post('/create', async (req, res) => {
    try {
        const newPlace = new PlaceModel(req.body);
        const savedPlace = await newPlace.save();

        res.status(201).json(savedPlace);
        console.log("Place successfully added");
    } catch (error) {
        console.error('Error creating place:', error);
        res.status(500).json({ message: 'Error creating place', error });
    }
});

module.exports = router;
