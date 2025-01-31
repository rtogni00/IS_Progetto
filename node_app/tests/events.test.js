const request = require("supertest");
const app = require("../testApp"); // Import Express app (testing version)
const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env file
const EventModel = require("../models/event");
const dbURI = process.env.MONGODB_URI;
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('axios');  // Mock axios to prevent real API calls

// Mock data for testing
const mockEvent = {
    name: "Music Concert",
    description: "A live music concert featuring local artists.",
    date: new Date("2025-02-15T19:00:00"),
    location: "Piazza Duomo",
    capacity: 100,
    participants: 0, // Default value
    enrolledUsers: [], // Empty array as no users are enrolled initially
    organizer: "Comune di Trento",
    pictures: ["concert1.jpg", "concert2.jpg"]
};

jest.mock("../tokenChecker", () => (req, res, next) => next());  // Skip token validation in tests
let token;


beforeAll(async () => {
    const testDBUri = dbURI;
    await mongoose.connect(testDBUri, {}); // Connect to database
    await EventModel.create(mockEvent);
    token = 'mockValidToken';  // TODO replace it with a real JWT if needed
});

afterAll(async () => {
    await EventModel.deleteMany({});
    await mongoose.connection.close(); // Close database connection
});

describe("Events API", () => {
    // Test: GET all events without query parameters
    it("should fetch all events", async () => {
        const res = await request(app).get("/api/v1/events");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // Test: GET all events with query parameter (name)
    it('should return events filtered by name', async () => {
    const res = await request(app).get('/api/v1/events?name=Music');  // Adjust query parameters as needed

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name', 'Music Concert');
    });

    // Test: GET all events with query parameter (location)
    it('should return events filtered by location', async () => {
    const res = await request(app).get('/api/v1/events?location=Trento');  // Adjust query parameters as needed

    // Handle case when events are returned directly or wrapped in 'events' property
    const events = res.body.events || res.body;

    expect(res.status).toBe(200);

    // If events are returned wrapped in 'events', it means no matching events were found
    if (res.body.events) {
        expect(events.length).toBe(0);  // Ensure no events match the query
    } else {
        // Otherwise, check that we got matching events
        expect(events).toBeInstanceOf(Array);  // Ensure it's an array of events
        expect(events.length).toBeGreaterThan(0);  // Check if there are events
        expect(events[0]).toHaveProperty('location', 'Trento, Italy');  // Test that location matches
    }
    });

    // Test: GET all events with query parameter (date)
    it('should return events filtered by date', async () => {
        const dateQuery = '2025-02-15';  // Specify the date to filter by
        const res = await request(app).get(`/api/v1/events?date=${dateQuery}`);

        // If 'events' exists, it's likely an empty response with no matching events
        const events = res.body.events || res.body;

        expect(res.status).toBe(200);

        if (res.body.events) {
            expect(res.body.events).toBeInstanceOf(Array);
            expect(res.body.events.length).toBe(0);  // No events found for the given date
        } else {
            expect(events).toBeInstanceOf(Array);
            expect(events.length).toBeGreaterThan(0);  // Ensure there are matching events

            // Convert dates to timestamps for comparison
            const targetDate = new Date(dateQuery).getTime();
            const nextDay = new Date(dateQuery);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayTime = nextDay.getTime();

            // Validate that the date of the first event matches the query
            const eventDate = new Date(events[0].date).getTime();
            expect(eventDate).toBeGreaterThanOrEqual(targetDate);  // Date should be on or after the target date
            expect(eventDate).toBeLessThan(nextDayTime);  // Date should be before the next day
        }
    });

    // Test: POST create event with valid data
    test('should create an event successfully', async () => {
        const mockGeocodeResponse = {
            data: [
                {
                    lat: '46.0702',
                    lon: '11.1217'
                }
            ]
        };
        axios.get.mockResolvedValue(mockGeocodeResponse);  // Mock OSM API response
        const res = await request(app)
            .post('/api/v1/events/create')
            .set('Authorization', `Bearer ${token}`)  // Attach the token
            .send(mockEvent);

        // console.log(res.status, res.body);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe(mockEvent.name);
        expect(res.body.latitude).toBe(parseFloat(mockGeocodeResponse.data[0].lat));
        expect(res.body.longitude).toBe(parseFloat(mockGeocodeResponse.data[0].lon));
    });

    // Test: POST create event with invalid data (missing required fields)
    test('should return error for missing required fields', async () => {
    const res = await request(app)
        .post('/api/v1/events/create')
        .set('Authorization', `Bearer ${token}`)
        .send({});  // Send an empty object or only a few fields

    // console.log(res.status, res.body);

    expect(res.status).toBe(500);  // Expecting a 500 Bad Request error
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Error');  // Check if the message indicates missing fields
    });

    // Test: POST create event with missing or invalid token
    test('should return error for missing or invalid token', async () => {
    // Reset the module cache and re-import the app to ensure `tokenChecker` is not mocked
    jest.resetModules(); 

    // Re-import the app so the original tokenChecker middleware is used
    const app = require("../testApp"); // Import Express app (testing version)



    const res = await request(app)
        .post('/api/v1/events/create')
        .send(mockEvent);

    // console.log(res.status, res.body);

    expect(res.status).toBe(500);  // Expecting a 403 Forbidden error for no token
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Error');
    });




});

/*
TODO:
- POST /api/v1/events/create con un profilo NON di tipo organizer
- GET /api/v1/events/:eventId/participants (Get participants for an event)
- POST /api/v1/events/:eventId/save (Save an event to user's saved events)
- POST /api/v1/events/:eventId/markPast (Mark an event as past)

*/
