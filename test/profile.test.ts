import { describe, it, expect, beforeAll } from "bun:test";
import db from "../src/config/database"; // Adjust path to database.ts
import { createProfile, getProfiles, getProfileById } from "../src/controllers/profile"; // Adjust path to profile.ts

describe("POST /api/profile - createProfile Controller", () => {
    // Helper to invoke the controller directly
    async function makeRequest(body: Record<string, any> | string) {
        const req = new Request("http://localhost:5500/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: typeof body === "string" ? body : JSON.stringify(body),
        });
        const res = await createProfile(req);
        const data = await res.json();
        return { status: res.status, data };
    }

    // Clean up test data before running tests
    beforeAll(async () => {
        await db`DELETE FROM profiles WHERE email LIKE '%test%@example.com'`;
    });

    it("should return 400 for invalid/missing JSON body", async () => {
        const { status, data } = await makeRequest("invalid json {");
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("invalid or missing body");
    });

    it("should return 400 when required fields are missing", async () => {
        const { status, data } = await makeRequest({
            email: "testmissing@example.com",
            // full_name omitted
        });
        expect(status).toBe(400);
        expect(data.error).toContain("Both full_name and email fields are required");
    });

    it("should return 400 when a string field is empty or whitespace-only", async () => {
        const { status, data } = await makeRequest({
            full_name: "  ", // Empty after trim
            email: "test@example.com",
        });
        expect(status).toBe(400);
        expect(data.error).toContain("cannot be an empty string");
    });

    it("should return 400 for an invalid email format", async () => {
        const { status, data } = await makeRequest({
            full_name: "John Doe",
            email: "not-an-email",
        });
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Invalid email format.");
    });

    it("should return 400 for an invalid age", async () => {
        const { status, data } = await makeRequest({
            full_name: "John Doe",
            email: "john@example.com",
            age: 200, // Out of 1-150 range
        });
        expect(status).toBe(400);
        expect(data.error).toContain("Age must be a positive integer between 1 and 150");
    });

    it("should create a profile successfully (201 Created)", async () => {
        const uniqueEmail = `test_${Date.now()}@example.com`;
        const { status, data } = await makeRequest({
            full_name: "Givendarian Test",
            email: uniqueEmail,
            phone: "+256700000000",
            bio: "Tester",
            location: "Kampala",
            age: 25,
        });

        expect(status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.message).toBe("Profile created successfully");
        expect(data.data.full_name).toBe("Givendarian Test");
    });

    it("should return 409 Conflict when creating a profile with a duplicate email", async () => {
        const duplicateEmail = `duplicate_${Date.now()}@example.com`;

        // First creation -> Should succeed
        await makeRequest({
            full_name: "First User",
            email: duplicateEmail,
        });

        // Second creation with same email -> Should fail with 409
        const { status, data } = await makeRequest({
            full_name: "Second User",
            email: duplicateEmail,
        });

        expect(status).toBe(409);
        expect(data.success).toBe(false);
        expect(data.error).toBe("A profile with this email already exists.");
    });
});

describe("GET Profile Endpoints", () => {
    let testProfileId: number;

    // Insert a known test record into the database before tests run
    beforeAll(async () => {
        // Clean up pre-existing test records
        await db`DELETE FROM profiles WHERE email = 'test_fetch@example.com'`;

        // Insert test record
        const result = await db`
            INSERT INTO profiles (full_name, email, phone, bio, location, age)
            VALUES ('Test Fetch User', 'test_fetch@example.com', '+256700112233', 'Bio text', 'Kampala', 30)
        `;

        // Step 2: Select the row using the newly generated insertId
        const [newProfile] = await db`
            SELECT * FROM profiles WHERE email = 'test_fetch@example.com'
        `;

        testProfileId = newProfile.id;
    });

    describe("GET /api/profile (getProfiles)", () => {
        it("should return 200 OK and an array of profiles", async () => {
            const req = new Request("http://localhost:5500/api/profile", {
                method: "GET",
            });

            const res = await getProfiles(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
            expect(data.data.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/profile?id=X (getProfileById)", () => {
        it("should return 200 OK and the matching profile for a valid ID", async () => {
            
            const req = new Request(
                `http://localhost:5500/api/profile?id=${testProfileId}`,
                { method: "GET" }
            );

            const res = await getProfileById(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(testProfileId);
            expect(data.data.email).toBe("test_fetch@example.com");
        });

        it("should return 400 Bad Request if ID parameter is missing or non-numeric", async () => {
            const req = new Request("http://localhost:5500/api/profile?id=abc", {
                method: "GET",
            });

            const res = await getProfileById(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toContain("valid numeric profile ID");
        });

        it("should return 404 Not Found for an ID that does not exist", async () => {
            const req = new Request("http://localhost:5500/api/profile?id=999999", {
                method: "GET",
            });

            const res = await getProfileById(req);
            const data = await res.json();

            expect(res.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toContain("not found");
        });
    });
});