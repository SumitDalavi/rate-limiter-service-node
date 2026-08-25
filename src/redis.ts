import Redis from "ioredis";

export const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  
  // We can pass an existing client for tests, or instantiate a new one
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};
