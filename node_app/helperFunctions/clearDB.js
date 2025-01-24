require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');

const dbURI = process.env.MONGODB_URI;

async function listCollections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(dbURI);

        console.log('Connected to database.');

        // Get the collections from the database
        const collections = await mongoose.connection.db.listCollections().toArray();

        // Print collection names
        console.log('Collections in the database:');
        collections.forEach(collection => {
            console.log(collection.name);
        });

        // Disconnect from the database
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    } catch (error) {
        console.error('Error listing collections:', error);
    }
}


// Function to clear all collections in the database
async function emptyDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(dbURI);

        console.log('Connected to database.');

        // List of collections to empty
        const collections = ['users', 'places', 'events'];

        // Empty each collection
        for (let collectionName of collections) {
            const collection = mongoose.connection.collection(collectionName);
            await collection.deleteMany({});  // Deletes all documents in the collection
            console.log(`All documents in the "${collectionName}" collection have been deleted.`);
        }

        // Disconnect from the database
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    } catch (error) {
        console.error('Error emptying the database:', error);
    }
}


// listCollections();
emptyDatabase();
