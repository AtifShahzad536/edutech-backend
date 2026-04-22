const dotenv = require('dotenv');

dotenv.config();

// We parse and export env variables here to avoid process.env sprinkling everywhere.
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/Edutech',
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_12345',
  
  // URLs
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Email
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: process.env.EMAIL_PORT,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
    FROM: process.env.EMAIL_FROM
  },
  
  // Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
    URL: process.env.CLOUDINARY_URL
  },
  
  // Stripe
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  // Pusher
  PUSHER: {
    APP_ID: process.env.PUSHER_APP_ID,
    KEY: process.env.PUSHER_KEY,
    SECRET: process.env.PUSHER_SECRET,
    CLUSTER: process.env.PUSHER_CLUSTER
  }
};
