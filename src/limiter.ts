import type { Redis } from "ioredis";

// We use a Lua script to ensure atomicity. 
// It removes elements older than the window, counts the remaining elements, 
// and adds the current timestamp if the count is below the limit.
const slidingWindowLuaScript = `
  local key = KEYS[1]
  local window_seconds = tonumber(ARGV[1])
  local max_requests = tonumber(ARGV[2])
  local current_timestamp = tonumber(ARGV[3])
  local unique_member = ARGV[4]
  
  local window_start = current_timestamp - window_seconds
  
  -- Remove older timestamps
  redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
  
  -- Count the remaining timestamps
  local current_requests = redis.call('ZCARD', key)
  
  if current_requests < max_requests then
    -- Allowed: add the current timestamp with a unique member string
    redis.call('ZADD', key, current_timestamp, unique_member)
    -- Set TTL to clean up automatically
    redis.call('EXPIRE', key, window_seconds)
    return { 1, max_requests - current_requests - 1 }
  else
    -- Rate limited
    return { 0, 0 }
  end
`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export class SlidingWindowRateLimiter {
  private redis: Redis;
  private windowSeconds: number;
  private maxRequests: number;

  constructor(redis: Redis, windowSeconds = 60, maxRequests = 100) {
    this.redis = redis;
    this.windowSeconds = windowSeconds;
    this.maxRequests = maxRequests;
    
    // Define the script command in ioredis
    this.redis.defineCommand("slidingWindowRateLimit", {
      numberOfKeys: 1,
      lua: slidingWindowLuaScript,
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    // Unique member so multiple requests in the same second don't overwrite each other
    const uniqueMember = `${currentTimestamp}-${Math.random().toString(36).substring(2, 10)}`;
    
    // @ts-ignore - The command is defined dynamically above
    const result = await this.redis.slidingWindowRateLimit(
      key,
      this.windowSeconds,
      this.maxRequests,
      currentTimestamp,
      uniqueMember
    );

    return {
      allowed: result[0] === 1,
      remaining: result[1],
    };
  }
}
