"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const redis_1 = require("./redis");
const limiter_1 = require("./limiter");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
const redisClient = (0, redis_1.getRedisClient)();
exports.redisClient = redisClient;
const windowSeconds = parseInt(process.env.DEFAULT_WINDOW_SECONDS || "60", 10);
const maxRequests = parseInt(process.env.DEFAULT_MAX_REQUESTS || "10", 10);
const limiter = new limiter_1.SlidingWindowRateLimiter(redisClient, windowSeconds, maxRequests);
app.post("/check", async (req, res) => {
    try {
        const { apiKey, endpoint } = req.body;
        if (!apiKey || !endpoint) {
            return res.status(400).json({ error: "Missing apiKey or endpoint in body" });
        }
        // Isolate limits per API key per endpoint
        const key = `ratelimit:${apiKey}:${endpoint}`;
        const result = await limiter.check(key);
        if (!result.allowed) {
            return res.status(429).json({
                allowed: false,
                error: "Too Many Requests",
                retryAfter: windowSeconds // simplistic retry indication
            });
        }
        return res.status(200).json({
            allowed: true,
            remaining: result.remaining
        });
    }
    catch (err) {
        console.error("Rate limiter error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
const port = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Rate Limiter Service running on port ${port}`);
        console.log(`Config: ${maxRequests} requests per ${windowSeconds}s`);
    });
}
