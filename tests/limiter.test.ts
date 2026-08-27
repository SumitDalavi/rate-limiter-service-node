import request from "supertest";
import RedisMock from "ioredis-mock";
import { app, redisClient } from "../src/index";
import { SlidingWindowRateLimiter } from "../src/limiter";

// Mock the Redis client used by the app to use ioredis-mock
jest.mock("../src/redis", () => ({
  getRedisClient: () => new RedisMock()
}));

describe("Sliding Window Rate Limiter Service", () => {
  let mockRedis: any;
  let limiter: SlidingWindowRateLimiter;

  beforeAll(() => {
    mockRedis = new RedisMock();
    // Re-instantiate the limiter with the mock for testing logic directly
    limiter = new SlidingWindowRateLimiter(mockRedis, 60, 2);
  });

  afterEach(async () => {
    await mockRedis.flushall();
  });

  it("should allow requests under the limit", async () => {
    const res1 = await limiter.check("test:key");
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = await limiter.check("test:key");
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it("should block requests over the limit", async () => {
    await limiter.check("test:key");
    await limiter.check("test:key");
    
    // 3rd request should be blocked
    const res3 = await limiter.check("test:key");
    expect(res3.allowed).toBe(false);
  });

  it("API should return 429 when rate limited", async () => {
    // Default limit is 10 requests. Make 10 successful requests.
    for (let i = 0; i < 10; i++) {
      await request(app).post("/check").send({ apiKey: "key1", endpoint: "/api/v1/data" }).expect(200);
    }
    
    // 11th request should fail with 429 Too Many Requests
    const res = await request(app).post("/check").send({ apiKey: "key1", endpoint: "/api/v1/data" });
    expect(res.status).toBe(429);
    expect(res.body.allowed).toBe(false);
  });

  it("API should return 400 if missing apiKey or endpoint", async () => {
    const res = await request(app).post("/check").send({ apiKey: "key1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing apiKey or endpoint in body");
  });

  it("API should return 500 on internal errors", async () => {
    // Force an error in the redis client
    jest.spyOn(redisClient, "slidingWindowRateLimit" as any).mockRejectedValueOnce(new Error("Redis error"));
    const res = await request(app).post("/check").send({ apiKey: "keyError", endpoint: "/api/v1/data" });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
  });
});
