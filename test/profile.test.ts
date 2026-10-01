import { describe, it, expect, beforeAll } from "bun:test";
import db from "../src/config/database"; // Adjust path to database.ts
import { createProfile } from "../src/controllers/profile"; // Adjust path to profile.ts

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