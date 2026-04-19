const request = require("supertest");
const app = require("../backend/server");

/**
 * @file tests/app.test.js
 * @desc API tests for CrowdOS server using Supertest and Jest.
 */
describe("Express App API Tests", () => {
    test("GET / should return health check message", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("🚀 CrowdOS Server Running");
    });

    test("GET /api/history should return array of history", async () => {
        const response = await request(app).get("/api/history");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty("data");
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("POST /api/rush/:gateId with invalid gate format should return 400", async () => {
        // Fails regex but passes length check
        const response = await request(app).post("/api/rush/BAD_G!");
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Invalid Gate ID format");
    });

    test("POST /api/rush/:gateId with excessively long gate should return 400", async () => {
        // Fails length check
        const response = await request(app).post("/api/rush/WAYTOOLONGGATEID");
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Gate ID length exceeds limit");
    });
    test("POST /api/rush/ without gateId should return 404", async () => {
        const response = await request(app).post("/api/rush/");
        expect(response.status).toBe(404);
    });

    test("POST /api/rush/:gateId with invalid characters should return 400", async () => {
        const response = await request(app).post("/api/rush/@@@");
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Invalid Gate ID format");
    });

    test("Full Flow: /api/history followed by /api/decision", async () => {
        const historyRes = await request(app).get("/api/history");
        expect(historyRes.status).toBe(200);
        expect(historyRes.body.success).toBe(true);

        const decisionRes = await request(app).get("/api/decision");
        expect(decisionRes.status).toBe(200);
        expect(decisionRes.body.success).toBe(true);
        expect(decisionRes.body.data).toHaveProperty("decision");
    });

    test("Caching Behavior: /api/history returns identical response within cache window", async () => {
        const firstRes = await request(app).get("/api/history");
        expect(firstRes.status).toBe(200);
        
        const secondRes = await request(app).get("/api/history");
        expect(secondRes.status).toBe(200);
        
        expect(firstRes.body).toEqual(secondRes.body);
    });

    test("Invalid JSON / Bad Request: Should return safe error response", async () => {
        const response = await request(app)
            .post("/api/rush/A")
            .set("Content-Type", "application/json")
            .send("{ invalid json: ");
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Bad Request");
    });

    test("GET /api/health should return health check success", async () => {
        const response = await request(app).get("/api/health");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
