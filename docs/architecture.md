# Architecture: Rate Limiter Service Node

## Sliding Window Algorithm (Redis + Lua)

This service implements a highly accurate "Sliding Window" algorithm using Redis Sorted Sets (ZSETs).

```mermaid
sequenceDiagram
    participant Client
    participant Express API
    participant Redis (Lua Script)

    Client->>Express API: POST /check { apiKey, endpoint }
    Express API->>Redis (Lua Script): EXEC slidingWindowRateLimit(key, window, max)
    
    Note over Redis (Lua Script): Atomically executed:<br/>1. Remove timestamps older than (now - window)<br/>2. Count remaining timestamps<br/>3. If count < max, add current timestamp
    
    alt Under Limit
        Redis (Lua Script)-->>Express API: [1, remaining]
        Express API-->>Client: 200 OK (allowed: true)
    else Over Limit
        Redis (Lua Script)-->>Express API: [0, 0]
        Express API-->>Client: 429 Too Many Requests (allowed: false)
    end
```

## Design Decisions

### 1. Why Lua over multiple Redis commands?
If we executed `ZREMRANGEBYSCORE`, `ZCARD`, and `ZADD` as separate operations from Node.js, we would introduce a **race condition**. Two concurrent requests could both read a count of `99` and both write their timestamp, exceeding the limit of `100`. 
Redis evaluates Lua scripts atomically, ensuring that the entire check-and-insert sequence happens without interruption.

### 2. Time Space Complexity
- **Memory**: We store one timestamp (an 8-byte float in Redis) per request within the window. At 100 req/min, this is trivial. At 1M req/min, it could use substantial RAM. For massive scale, a "Sliding Window Log" might be replaced by a "Sliding Window Counter" or "Token Bucket" algorithm to save memory, but this implementation provides the highest accuracy.
- **Time**: `ZREMRANGEBYSCORE` is O(log(N) + M) where M is the number of elements removed. Since we run this frequently, M is typically 0 or 1, making it highly efficient.
