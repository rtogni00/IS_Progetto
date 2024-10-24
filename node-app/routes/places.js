const express = require('express');
const router = express.Router();

// TODO Define place routes here
router.get('/', (req, res) => {
    // TODO Handle fetching places
    res.status(201).json({ message: 'Places route hit successfully!' });
});

module.exports = router;
