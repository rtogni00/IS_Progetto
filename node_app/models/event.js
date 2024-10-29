var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the event schema
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
    capacity: {
        type: Number,
        description: "Maximum number of participants"
    },
    organizer: {
        // type: Schema.Types.ObjectId,
        type: String,
        ref: 'User',
        required: true,
        description: "Reference to the organizer who created the event"
    }
}, {
    timestamps: true
});

// Create and export the Event model
const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;


