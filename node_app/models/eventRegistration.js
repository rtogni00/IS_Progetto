// NOTE
// The Registration model is just a backend implementation detail to manage relationships 
// between users and events. The API doc already includes endpoints for registering for events, 
// viewing registrations, etc., it doesn’t need to know the specifics of how data is stored.

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the event schema
const EventRegistrationSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['registered', 'cancelled'],
        default: 'registered'
    }
}, { timestamps: true });

// Add a unique index to prevent duplicate registrations
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Create and export the Event model
const RegistrationModel = mongoose.model('Registration', EventRegistrationSchema);
module.exports = RegistrationModel;

