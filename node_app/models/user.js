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
        enum: ['basicUser', 'owner', 'organizer'],
        required: true
    }
}, { timestamps: true });

// Create and export the User model
const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
