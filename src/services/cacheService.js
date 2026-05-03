const redisStatus = require('../config/redis');

const cacheService = {
  // Get data from cache
  get: async (key) => {
    if (!redisStatus.isAvailable || !redisStatus.client) return null;
    try {
      const data = await redisStatus.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Cache Get Error [${key}]:`, error.message);
      return null;
    }
  },

  // Set data to cache with TTL
  set: async (key, data, ttl = 3600) => {
    if (!redisStatus.isAvailable || !redisStatus.client) return;
    try {
      await redisStatus.client.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      console.error(`❌ Cache Set Error [${key}]:`, error.message);
    }
  },

  // Delete from cache
  del: async (key) => {
    if (!redisStatus.isAvailable || !redisStatus.client) return;
    try {
      await redisStatus.client.del(key);
    } catch (error) {
      console.error(`❌ Cache Del Error [${key}]:`, error.message);
    }
  },

  // Clear pattern
  clearPattern: async (pattern) => {
    if (!redisStatus.isAvailable || !redisStatus.client) return;
    try {
      const keys = await redisStatus.client.keys(pattern);
      if (keys.length > 0) {
        await redisStatus.client.del(keys);
      }
    } catch (error) {
      console.error(`❌ Cache Clear Error [${pattern}]:`, error.message);
    }
  }
};

module.exports = cacheService;
