const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the user schema
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'owner', 'organizer'], // user = basicUser
        required: true
    },

    // Array of saved event IDs
    savedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],

    // Array of past events (event history)
    pastEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    // Array of events the user is enrolled to
    enrolledEvents: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event' 
    }]
}, { timestamps: true });

// Create and export the User model
const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
