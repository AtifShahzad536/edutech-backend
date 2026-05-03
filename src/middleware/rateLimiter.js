const rateLimit = require('express-rate-limit');
const AppError = require('../utils/appError');

/**
 * Enterprise Rate Limiting Policy
 * Prevents DDoS attacks, brute-force attempts, and resource exhaustion.
 */

// 1) Global Rate Limiter: General protection for all API routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next) => {
    next(new AppError('Too many requests from this IP. Please try again later.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

// 2) Auth Rate Limiter: Stricter limits for Login/Register to prevent brute force/spam
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 attempts per hour
  message: 'Too many login/register attempts, please try again after an hour',
  handler: (req, res, next) => {
    next(new AppError('Strict security limit reached. Please try again in an hour.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

// 3) Burst Limiter: Prevents sudden spikes in a very short window (e.g., duplicate clicks)
const burstLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Increased to 300 to support hot-reload in development
  message: 'Slow down! You are sending requests too fast.',
  handler: (req, res, next) => {
    next(new AppError('Too many rapid requests. Please slow down.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

module.exports = {
  globalLimiter,
  authLimiter,
  burstLimiter
};
