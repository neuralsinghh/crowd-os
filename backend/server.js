// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { runAgent } = require("../ai-engine/agent");
const { getAIDecision } = require("../ai-engine/gemini");
const { triggerRush, getCrowdData } = require("../simulation/sim");

const db = require('./database');

const app = express();
app.disable("x-powered-by"); // Hide Technology Stack

app.use(helmet({
    contentSecurityPolicy: { useDefaults: true },
    frameguard: { action: 'deny' },
    xssFilter: true
})); // Security headers

app.use(cors({ origin: ["http://localhost:3000"] }));
app.use(express.json({ limit: "10kb" })); // Payload size limit

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests, please try again later." }
});
app.use(limiter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ["http://localhost:3000"] }
});

const PORT = process.env.PORT || 3000;

// ==========================================
// 🏃 RUSH ENDPOINT
// ==========================================
app.post("/api/rush/:gateId", (req, res) => {
    const { gateId } = req.params;

    if (gateId && gateId.length > 10) {
        return res.status(400).json({ success: false, message: "Gate ID length exceeds limit" });
    }

    if (!gateId || typeof gateId !== 'string' || gateId.trim() === '') {
        return res.status(400).json({ success: false, message: "Invalid or missing Gate ID" });
    }

    const sanitizedGateId = gateId.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(sanitizedGateId)) {
        return res.status(400).json({ success: false, message: "Invalid Gate ID format" });
    }

    const success = triggerRush(sanitizedGateId);

    if (success) {
        return res.json({
            success: true,
            message: `Rush triggered at Gate ${sanitizedGateId}`
        });
    }

    return res.status(400).json({
        success: false,
        message: "Invalid Gate ID"
    });
});

// ==========================================
// 📈 HISTORY ENDPOINT
// ==========================================
let historyCache = { timestamp: 0, data: null };

/**
 * @route GET /api/history
 * @desc Retrieves the last 20 crowd distribution records from the database.
 * @returns {Object} { success: boolean, message: string, data: Array }
 */
app.get("/api/history", (req, res) => {
    // Optimization: Cache history to prevent redundant DB I/O during heavy traffic
    if (Date.now() - historyCache.timestamp < 5000 && historyCache.data) {
        return res.json(historyCache.data);
    }

    try {
        const rows = db
            .prepare(`SELECT * FROM crowd_history ORDER BY id DESC LIMIT 20`)
            .all();

        const responsePayload = { success: true, message: "History retrieved successfully", data: rows.reverse() };
        historyCache = { timestamp: Date.now(), data: responsePayload };
        res.json(responsePayload);

    } catch (err) {
        console.error("[Server] History fetch error:", err.message);
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});

// ==========================================
// 🚀 DECISION API
// ==========================================
let decisionCache = { timestamp: 0, data: null };

/**
 * @route GET /api/decision
 * @desc Obtains an AI-driven decision for the current crowd distribution.
 * @returns {Object} { success: boolean, message: string, data: Object }
 */
app.get("/api/decision", async (req, res) => {

    // Optimization: Reuse recent AI decision to prevent redundant complex computation
    if (Date.now() - decisionCache.timestamp < 5000 && decisionCache.data) {
        return res.json(decisionCache.data);
    }

    try {
        let observation;

        // 🧠 Try agent first
        try {
            const agentResult = await runAgent();
            observation = agentResult.observation;
        } catch (err) {
            console.warn("[Server] ⚠️ Agent failed → simulation fallback");
            observation = getCrowdData();
        }

        // 🤖 Try Gemini
        let aiText = null;
        try {
            aiText = await getAIDecision(observation);
        } catch (err) {
            console.warn("[Server] ⚠️ Gemini failed:", err.message);
        }

        const responsePayload = {
            success: true,
            message: "Decision retrieved successfully",
            data: {
                timestamp: Date.now(),
                source: aiText ? "agent + gemini" : "simulation",
                crowd: observation,
                decision: aiText || "AI Suggestion: Choose the least congested gate."
            }
        };

        decisionCache = { timestamp: Date.now(), data: responsePayload };
        return res.json(responsePayload);

    } catch (err) {
        console.error("[Server] Decision API error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ==========================================
// 🧪 HEALTH CHECK
// ==========================================
/**
 * @route GET /
 * @route GET /api/health
 * @desc API Health Check
 * @returns {Object} { success: boolean, message: string }
 */
app.get(["/", "/api/health"], (req, res) => {
    res.json({ success: true, message: "🚀 CrowdOS Server Running" });
});

// ==========================================
// 🗺️ CONFIG API
// ==========================================
/**
 * @route GET /api/config
 * @desc Retrieves non-sensitive environment configuration for the frontend.
 * @returns {Object} { success: boolean, message: string, data: Object }
 */
app.get("/api/config", (req, res) => {
    res.json({
        success: true,
        message: "Config retrieved successfully",
        data: {
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
        }
    });
});

// ==========================================
// 🚨 ERROR HANDLING MIDDLEWARE
// ==========================================
/**
 * Global Error Handler Middleware
 */
app.use((err, req, res, next) => {
    console.error("[Server] Unhandled Error:", err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: statusCode === 400 ? "Bad Request" : "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { data: err.message })
    });
});

// ==========================================
// 🔌 WEBSOCKET
// ==========================================
io.on("connection", (socket) => {
    console.info("[Server] 🟢 Client connected");

    socket.on("disconnect", () => {
        console.info("[Server] 🔴 Client disconnected");
    });
});

// ==========================================
// 🔄 REAL-TIME LOOP (IMPROVED)
// ==========================================
setInterval(async () => {

    try {
        let observation;

        // 🧠 Agent
        try {
            const agentResult = await runAgent();
            observation = agentResult.observation;
        } catch {
            observation = getCrowdData();
        }

        // 🤖 Gemini
        let aiText = null;
        try {
            aiText = await getAIDecision(observation);
        } catch {
            // silent fail (avoid spam)
        }

        const payload = {
            timestamp: Date.now(),
            source: aiText ? "agent + gemini" : "simulation",
            crowd: observation,
            decision: aiText || "AI Suggestion: Choose the least congested gate."
        };

        io.emit("crowd_update", payload);

    } catch (err) {
        console.error("[Server] ❌ Loop Error:", err.message);
    }

}, 2000);

// ==========================================
// 🚀 START SERVER
// ==========================================
if (require.main === module) {
    server.listen(PORT, () => {
        console.info(`[Server] 🔥 Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;