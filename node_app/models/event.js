var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const EventSchema = new Schema({
    name: {
        type: String,
        required: true,
        description: "Name of the event"
    },
    description: {
        type: String,
        description: "Description of the event"
    },
    date: {
        type: Date,
        required: true,
        description: "Date and time of the event"
    },
    location: {
        type: String,
        required: true,
        description: "Location of the event"
    },
    latitude: { 
        type: Number, 
        description: "Latitude of the location" 
    },
    longitude: { 
        type: Number, 
        description: "Longitude of the location" 
    },
    capacity: {
        type: Number,
        description: "Maximum number of participants"
    },
    organizer: {
        type: String,
        ref: 'User',
        required: true,
        description: "Reference to the organizer who created the event"
    },
    pictures: {
        type: [String], // Array of strings for picture URLs
        description: "Array of picture URLs of the event location"
    },
    participants: {
        type: Number,
        default: 0,
        description: "Current number of participants"
    },
    enrolledUsers: {
        type: [Schema.Types.ObjectId], // Array of user IDs
        ref: 'User',
        description: "Array of user IDs representing enrolled users"
    }
}, {
    timestamps: true
});

// Create and export the Event model
const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;
