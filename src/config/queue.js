const { Queue } = require('bullmq');
const redisStatus = require('./redis');

/**
 * Enterprise Queue Hub
 * Only initializes queues if Redis was successfully discovered.
 */
let emailQueue = null;
let notificationQueue = null;
let fileProcessingQueue = null;

const connection = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || '127.0.0.1',
  port: parseInt(process.env.REDIS_URL?.split(':')[2]) || 6379,
};

// We wrap the initialization. If Redis isn't there, we just don't create them.
// Rest of the app handles 'null' queues gracefully.
if (redisStatus.isAvailable) {
  try {
    emailQueue = new Queue('email-queue', { connection });
    notificationQueue = new Queue('notification-queue', { connection });
    fileProcessingQueue = new Queue('file-processing-queue', { connection });
  } catch (err) {
    // Silent fail
  }
}

module.exports = {
  emailQueue,
  notificationQueue,
  fileProcessingQueue
};
