const request = require("supertest");
const app = require("../backend/server");

describe("Express App API Tests", () => {
    test("GET / should return health check message", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toContain("🚀 CrowdOS Server Running");
    });

    test("GET /api/history should return array of history", async () => {
        const response = await request(app).get("/api/history");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("history");
        expect(Array.isArray(response.body.history)).toBe(true);
    });

    test("POST /api/rush/:gateId with invalid gate should return 400", async () => {
        // According to sim logic, 'INVALID' might fail if triggerRush returns false
        const response = await request(app).post("/api/rush/INVALID_GATE");
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Invalid Gate ID format");
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
});
