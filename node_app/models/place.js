var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the place schema
const PlaceSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Create and export the Place model
const PlaceModel = mongoose.model('Place', PlaceSchema);
module.exports = PlaceModel;
