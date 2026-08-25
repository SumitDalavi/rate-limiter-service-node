"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const getRedisClient = () => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    // We can pass an existing client for tests, or instantiate a new one
    return new ioredis_1.default(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
};
exports.getRedisClient = getRedisClient;
