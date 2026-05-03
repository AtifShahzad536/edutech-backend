const redisClient = require('../config/redis');

/**
 * Enterprise Caching Middleware
 * Automatically caches GET responses in Redis.
 * 
 * @param {number} duration - Cache duration in seconds.
 */
const cache = (duration = 600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    if (!redisClient || !redisClient.isAvailable || !redisClient.client) {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await redisClient.client.get(key);

      if (cachedResponse) {
        console.log(`⚡ Cache Hit: ${key}`);
        return res.status(200).json(JSON.parse(cachedResponse));
      }

      // If no cache, override res.json to capture response
      res.originalJson = res.json;
      res.json = (body) => {
        // Cache the body for the specified duration
        redisClient.client.set(key, JSON.stringify(body), 'EX', duration);
        res.originalJson(body);
      };

      console.log(`📦 Cache Miss: ${key}`);
      next();

    } catch (error) {
      console.error('❌ Cache Middleware Error:', error);
      next();
    }
  };
};

/**
 * Utility to clear specific cache keys or patterns
 */
const clearCache = async (pattern) => {
  if (!redisClient || !redisClient.client) return;
  const keys = await redisClient.client.keys(`__express__${pattern}`);
  if (keys.length > 0) {
    await redisClient.client.del(keys);
    console.log(`🧹 Cleared ${keys.length} cache keys`);
  }
};

module.exports = { cache, clearCache };
