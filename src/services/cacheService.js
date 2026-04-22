const Redis = require('ioredis');

let redisConnected = false;
let redis = null;

if (process.env.NODE_ENV !== 'test') {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 0, // Fail immediately
      showFriendlyErrorStack: true,
      enableOfflineQueue: false, // Don't queue commands if down
      lazyConnect: true, // Don't connect until used
    });

    redis.on('connect', () => {
      redisConnected = true;
      console.log('⚡ Redis Connected');
    });

    redis.on('error', (err) => {
      redisConnected = false;
      // Only log once to avoid spam
      if (err.code === 'ECONNREFUSED') {
        // Sliently handle connection refused
      } else {
        console.error('❌ Redis Error:', err.message);
      }
    });

    // Try to connect once
    redis.connect().catch(() => {
      redisConnected = false;
    });
  } catch (err) {
    console.error('❌ Redis Init Failed:', err.message);
  }
}

const cacheService = {
  // Get data from cache
  get: async (key) => {
    if (!redisConnected) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  // Set data to cache with TTL
  set: async (key, data, ttl = 3600) => {
    if (!redisConnected) return;
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      // Ignore
    }
  },

  // Delete from cache
  del: async (key) => {
    if (!redisConnected) return;
    try {
      await redis.del(key);
    } catch (error) {
      // Ignore
    }
  },

  // Clear pattern
  clearPattern: async (pattern) => {
    if (!redisConnected) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      // Ignore
    }
  }
};

module.exports = cacheService;
