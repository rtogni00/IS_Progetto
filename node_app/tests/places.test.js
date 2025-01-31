const request = require("supertest");
const app = require("../testApp"); // Import Express app (testing version)
const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env file
const PlaceModel = require("../models/place");
const UserModel = require("../models/user");
const dbURI = process.env.MONGODB_URI;
const jwt = require('jsonwebtoken');


let organizerToken, ownerToken;
let place1, place2;

beforeAll(async () => {
    const testDBUri = dbURI;
    await mongoose.connect(testDBUri, {}); // Connect to database

    // Create test users
    const organizer = await UserModel.create({
        username: 'organizerUser',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'organizer'
    });
    const owner = await UserModel.create({
        username: 'ownerUser',
        email: 'owner@example.com',
        password: 'password123',
        role: 'owner'
    });

    // Generate JWT tokens for the users
    organizerToken = jwt.sign({ username: organizer.username, role: organizer.role }, process.env.SUPER_SECRET);
    ownerToken = jwt.sign({ username: owner.username, role: owner.role }, process.env.SUPER_SECRET);

    // Create mock places
    place1 = await PlaceModel.create({ name: 'Place 1', location: 'Location 1', capacity: 100, owner: 'ownerUser' });
    place2 = await PlaceModel.create({ name: 'Place 2', location: 'Location 2', capacity: 200, owner: 'ownerUser' });
});

afterAll(async () => {
    await UserModel.deleteMany({}); // Clean up users
    await PlaceModel.deleteMany({}); // Clean up places
    await mongoose.connection.close(); // Close database connection
});

describe("Places API", () => {
    // Test: GET all places being logged in as organizer
    test('should return a list of all places as an organizer', async () => {
        const res = await request(app)
            .get('/api/v1/places')
            .set('Authorization', `Bearer ${organizerToken}`)
            .expect(200);

        expect(res.body).toHaveLength(2); // 2 places created in the setup
        expect(res.body[0]).toHaveProperty('name', 'Place 1');
        expect(res.body[1]).toHaveProperty('name', 'Place 2');
    });

    // Test: GET all places without being logged in
    test('should return 401 when trying to fetch places without being logged in', async () => {
        const res = await request(app)
            .get('/api/v1/places')
            .expect(401); // Forbidden since not logged in
    });



    // Test: GET all places without being logged in as organizer
    test('should return 403 when trying to fetch places without being logged in as organizer', async () => {
        const res = await request(app)
            .get('/api/v1/places')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(403); // Forbidden since not an organizer
    });

    // Test: GET a place by its name being logged in as organizer
    test('should return a place by its name as an organizer', async () => {
        const res = await request(app)
            .get(`/api/v1/places/${place1.name}`)
            .set('Authorization', `Bearer ${organizerToken}`)
            .expect(200);

        expect(res.body).toHaveProperty('name', 'Place 1');
    });

    // Test: GET a place by its name without being logged in
    test('should return 403 when trying to fetch a place without being logged in', async () => {
        const res = await request(app)
            .get(`/api/v1/places/${place1.name}`)
            .expect(401); // Forbidden
    });

    // Test: GET a place by its name without being logged in as organizer
    test('should return 403 when trying to fetch a place without being logged in as organizer', async () => {
        const res = await request(app)
            .get(`/api/v1/places/${place1.name}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(403); // Forbidden
    });

    // Test: POST new place without being logged in
    test('should return 401 when trying to create a place without being logged in', async () => {
        const res = await request(app)
            .post('/api/v1/places/create')
            .send({
                name: 'New Place',
                location: 'New Location',
                capacity: 50,
                owner: 'ownerUser'
            })
            .expect(401); // Forbidden
    });


    // Test: POST new place without being an owner
    test('should return 403 when trying to create a place without being an owner', async () => {
        const res = await request(app)
            .post('/api/v1/places/create')
            .set('Authorization', `Bearer ${organizerToken}`)
            .send({
                name: 'New Place',
                location: 'New Location',
                capacity: 50,
                owner: 'ownerUser'
            })
            .expect(403); // Forbidden because the user is not an owner
    });

    // Test: POST a new place with correct data
    test('should create a new place with correct data when logged in as owner', async () => {
        const res = await request(app)
            .post('/api/v1/places/create')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'New Place',
                location: 'New Location',
                capacity: 150,
                owner: 'ownerUser'
            })
            .expect(201); // Created

        expect(res.body).toHaveProperty('name', 'New Place');
        expect(res.body).toHaveProperty('location', 'New Location');
    });

    // Test: POST a new place with partial data
    test('should return error for missing required data when creating a place', async () => {
        const res = await request(app)
            .post('/api/v1/places/create')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Incomplete Place', // Missing location and capacity
                owner: 'ownerUser'
            })
            .expect(500); // Bad request because of missing data

        expect(res.body).toHaveProperty('message', 'Error creating place');
    });

});
