require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const EventModel = require('../models/event');
const UserModel = require('../models/user');
const dbURI = process.env.MONGODB_URI;

// Sample events
const sampleEvents = [
    {
        name: "Music Concert",
        description: "A live music concert featuring local artists.",
        date: new Date("2025-02-15T19:00:00"),
        location: "Piazza Duomo",
        capacity: 100,
        participants: 0, // Default value
        enrolledUsers: [], // Empty array as no users are enrolled initially
        organizer: "Comune di Trento",
        pictures: ["concert1.jpg", "concert2.jpg"]
    },
    {
        name: "Tech Meetup",
        description: "Networking and discussions on the latest news in tech.",
        date: new Date("2025-03-10T18:30:00"),
        location: "University of Trento",
        capacity: 50,
        participants: 0, // Default value
        enrolledUsers: [], // Empty array as no users are enrolled initially
        organizer: "University of Trento",
        pictures: ["tech1.jpg"]
    },
    {
        name: "Book Presentation",
        description: "Showcasing book by local author.",
        date: new Date("2025-04-20T10:00:00"),
        location: "Biblioteca Comunale di Trento",
        capacity: 200,
        participants: 0, // Default value
        enrolledUsers: [], // Empty array as no users are enrolled initially
        organizer: "Organizer1",
        pictures: ["art1.jpg", "art2.jpg", "art3.jpg"]
    }
];


// Sample users
const sampleUsers = [
    {
        username: "user",
        email: "user@example.com",
        password: "user", // Assume passwords are hashed elsewhere
        role: "user"
    },
    {
        username: "organizer",
        email: "organizer@example.com",
        password: "organizer",
        role: "organizer"
    },
    {
        username: "owner",
        email: "owner@example.com",
        password: "owner",
        role: "owner"
    }
];

// Function to populate database
async function fillDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(dbURI);

        console.log('Connected to database.');

        // Add new events to the database
        const insertResult = await EventModel.insertMany(sampleEvents);
        console.log(`Added ${insertResult.length} events to the database.`);

        // Add new users to the database
          // Add new users to the database
        const insertUsers = await UserModel.insertMany(sampleUsers);
        console.log(`Added ${insertUsers.length} users to the database.`);

        // Disconnect from the database
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

fillDatabase();
