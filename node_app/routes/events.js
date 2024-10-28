const express = require('express');
const router = express.Router();

// TODO define event routes here
router.get('/', (req, res) => {
    // TODO Handle fetching events
        res.status(201).json({ message: 'Events route hit successfully!' });
});

module.exports = router;
