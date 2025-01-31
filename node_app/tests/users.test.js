const request = require("supertest");
const app = require("../testApp"); // Import Express app (testing version)
const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env file
const UserModel = require("../models/user");
const dbURI = process.env.MONGODB_URI;

beforeAll(async () => {
    const testDBUri = dbURI;
    await mongoose.connect(testDBUri, {}); // Connect to database
});

afterAll(async () => {
    await mongoose.connection.close(); // Close database connection
});

describe("Users API", () => {

    // Cleanup: Remove any test user after each test
    afterEach(async () => {
        await UserModel.deleteMany({
            email: { $in: ["testuser@example.com", "existing@example.com", "valid@example.com"] }
        });
    });

    // Test: POST registration with complete data
    test('should signup successfully with complete data', async () => {
        const newUser = {
            username: "testuser",
            email: "testuser@example.com",
            password: "securepassword",
            role: "user"
        };

        const res = await request(app)
            .post('/api/v1/users/signup')
            .send(newUser);

        expect(res.status).toBe(201); // Expecting successful creation
        expect(res.body).toHaveProperty("message", "User created successfully");
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("username", newUser.username);
        expect(res.body.user).toHaveProperty("email", newUser.email);
        expect(res.body).toHaveProperty("token"); // JWT should be returned

        // Cleanup: Remove test user from the database
        await UserModel.deleteOne({ email: newUser.email });
    });

    // Test: POST registration with incomplete data
    test('should return error when required fields are missing', async () => {
        const incompleteUser = {
            username: "testuser2",
            email: "testuser2@example.com"
            // Missing password and role
        };

        const res = await request(app)
            .post('/api/v1/users/signup')
            .send(incompleteUser);

        expect(res.status).toBe(400); // Expecting Bad Request
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Invalid"); // Ensure it reports an error
    });

    // Test: POST registration with email already in use
    test('should return error when email is already in use', async () => {
        // First, register a user
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "securepassword",
            role: "user"
        };

        await request(app)
            .post('/api/v1/users/signup')
            .send(existingUser)
            .expect(201); // Expecting successful signup

        // Attempt to register with the same email
        const res = await request(app)
            .post('/api/v1/users/signup')
            .send({
                username: "newuser",
                email: "existing@example.com", // Same email
                password: "anotherpassword",
                role: "user"
            })
            .expect(400); // Expecting Bad Request

        // expect(res.status).toBe(400); // Expecting Bad Request
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Email already in use");

        // Cleanup: Remove test user from the database
        await UserModel.deleteOne({ email: existingUser.email });
    });

    // Test: POST registration with username already in use
    test('should return error when email is already in use', async () => {
        // First, register a user
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "securepassword",
            role: "user"
        };

        await request(app)
            .post('/api/v1/users/signup')
            .send(existingUser);

        // Attempt to register with the same email
        const res = await request(app)
            .post('/api/v1/users/signup')
            .send({
                username: "existinguser",
                email: "another@example.com", // Same email
                password: "anotherpassword",
                role: "user"
            });

        expect(res.status).toBe(400); // Expecting Bad Request
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Username already in use");

        // Cleanup: Remove test user from the database
        await UserModel.deleteOne({ username: existingUser.username });
    });

    // Test: POST login with correct data
    test('should login successfully with correct credentials', async () => {
        // First, register a user
        const validUser = {
            username: "validuser",
            email: "valid@example.com",
            password: "securepassword",
            role: "user"
        };

        await request(app)
            .post('/api/v1/users/signup')
            .send(validUser);

        // Now, attempt to log in with the same credentials
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({
                email: "valid@example.com",
                password: "securepassword"
            });

        expect(res.status).toBe(200); // Expecting OK response
        expect(res.body).toHaveProperty("token"); // Should return a token
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toContain("Login successful");
    });

    // Test: POST login with invalid password
    test("should return error for login with incorrect password", async () => {
        const loginData = {
            email: "valid@example.com",  // Use the same email from test 4
            password: "wrongpassword"       // Incorrect password
        };

        const res = await request(app)
            .post("/api/v1/users/login")
            .send(loginData);

        expect(res.status).toBe(401);  // Expecting Unauthorized error
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toBe("Invalid email or password");
    });

    // Test: POST login with invalid email
    test("should return error for login with incorrect password", async () => {
        const loginData = {
            email: "invalid@example.com",  // Wrong email
            password: "securepassword"       // Correct password
        };

        const res = await request(app)
            .post("/api/v1/users/login")
            .send(loginData);

        expect(res.status).toBe(401);  // Expecting Unauthorized error
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toBe("Invalid email or password");
    });

    // Test: POST login without data
    test("should return error for login without data", async () => {
        const loginData = {};

        const res = await request(app)
            .post("/api/v1/users/login")
            .send(loginData);

        expect(res.status).toBe(401);  // Expecting Unauthorized error
        expect(res.body).toHaveProperty("message");
        expect(res.body.message).toBe("Invalid email or password");
    });
});
