const nodemailer = require('nodemailer');
const { emailQueue } = require('../config/queue');
const redisClient = require('../config/redis');

// Direct transporter for fallbacks if Redis is offline
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  /**
   * Enterprise-Grade Email Sender with Intelligent Fallback.
   * Uses high-performance BullMQ if Redis is ready, otherwise falls back to direct sending.
   */
  sendEmail: async (options) => {
    // 1. Try to use Background Queue if Redis is available
    if (redisClient && redisClient.isReady) {
      try {
        await emailQueue.add('send-email', {
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        });

        console.log(`📬 Job Queued: Email to ${options.to}`);
        return { success: true, method: 'queue' };
      } catch (error) {
        console.warn('⚠️ Queue submission failed, falling back to direct sending.');
      }
    }

    // 2. Fallback: Direct sending if Redis is missing (Development mode)
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'EduTech <noreply@edutech.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`📧 Direct Email Sent: ${info.messageId}`);
      return { success: true, method: 'direct' };
    } catch (error) {
      console.error('❌ Email Service Failure:', error);
      throw error;
    }
  },

  sendWelcomeEmail: async (user) => {
    return emailService.sendEmail({
      to: user.email,
      subject: 'Welcome to EduTech!',
      html: `<h1>Welcome, ${user.firstName}!</h1><p>We are excited to have you on board.</p>`,
    });
  }
};

module.exports = emailService;
