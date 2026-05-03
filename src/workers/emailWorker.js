const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const redisStatus = require('../config/redis');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Enterprise Worker for processing Email tasks.
 * Optimized to fail silently if Redis is missing in development.
 */

// Only start the worker if Redis is alive
let emailWorker;

const startWorker = () => {
  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const connection = {
    host: process.env.REDIS_URL.split('://')[1]?.split(':')[0] || '127.0.0.1',
    port: parseInt(process.env.REDIS_URL.split(':')[2]) || 6379,
  };

  try {
    emailWorker = new Worker('email-queue', async (job) => {
      const { to, subject, text, html } = job.data;
      console.log(`✉️ Worker: Sending Email to ${to}`);

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to,
          subject,
          text,
          html,
        });
        console.log(`✅ Worker: Email sent to ${to}`);
      } catch (error) {
        console.error(`❌ Worker: Email send failed:`, error);
        throw error;
      }
    }, { 
      connection,
      connectionName: 'email-worker'
    });

    emailWorker.on('error', (err) => {
      // Suppress connection errors from spamming the console
      if (err.code !== 'ECONNREFUSED') {
        console.error('❌ Worker Connection Error:', err);
      }
    });

    console.log('👷 Background Email Worker Started');
  } catch (err) {
    console.warn('⚠️ Could not start Email Worker. Redis might be offline.');
  }
};

// Delay worker start slightly to allow redisStatus to detect status
// Skip worker initialization in test environment to avoid open handles
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    if (redisStatus && redisStatus.isAvailable) {
      startWorker();
    }
  }, 1000);
}

module.exports = emailWorker;
