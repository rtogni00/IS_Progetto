// NOTE: as of now, the server is being handled in app.js
// This file is being used only as aggregator for more modularity

const usersRoute = require('./routes/users');
const eventsRoute = require('./routes/events');
const placesRoute = require('./routes/places');

module.exports = {
    usersRoute,
    eventsRoute,
    placesRoute,
};