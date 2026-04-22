const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app = require('./app');
const pusher = require('./config/pusher');

// 🚀 INITIALIZE BACKGROUND WORKERS (Enterprise Scalability)
// These listen for tasks in the Redis Queues
require('./workers/emailWorker');

// Make pusher accessible to all routes
app.set('pusher', pusher);

const server = http.createServer(app);

// Start Server
const startServer = async () => {
  try {
    // 1) Connect to Database
    await connectDB();
    console.log('📦 Database connection successful');

    // 2) Listen on Port
    const PORT = require('./config/env').PORT;
    server.listen(PORT, () => {
      console.log(`🚀 EduTech API Server running on port ${PORT}`);
      console.log(`🌍 Mode: ${require('./config/env').NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (e.g., from Heroku or Docker)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
