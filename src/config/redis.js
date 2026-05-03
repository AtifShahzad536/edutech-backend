const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Enterprise Discovery Service
 * Checks for Redis existence once. If not found, it disables all Redis-dependent features
 * to ensure a clean terminal and stable development environment.
 */
let redisClient = null;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// We use a temporary client just to check the connection
const checkClient = new Redis(REDIS_URL, {
  enableOfflineQueue: false,
  connectTimeout: 500,
  retryStrategy: () => null, // Do not retry
});

checkClient.on('error', () => {
  // Silent fail
  checkClient.disconnect();
});

// This will be used by the rest of the app to check status
const redisStatus = {
  isAvailable: false,
  client: null
};

// Perform the check only if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
  // After 3 seconds, if not connected, declare Redis offline for this session
  const timer = setTimeout(() => {
    if (!redisStatus.isAvailable) {
      console.warn('⚠️ Redis offline. Running in standard mode (No-Cache/Direct-Emails).');
      checkClient.disconnect();
    }
  }, 3000);

  checkClient.on('connect', () => {
    clearTimeout(timer);
    console.log('🚀 Redis detected! High-performance features enabled.');
    redisStatus.isAvailable = true;
    redisStatus.client = checkClient;
  });
  
  // Ensure the timer doesn't keep the process alive
  timer.unref();
}

module.exports = redisStatus;
