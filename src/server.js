const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Stripe Webhook MUST be routed before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').handleWebhook);

// Standard Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/uploads', uploadRoutes);
app.use('/api/users/profile', profileRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/live', require('./routes/liveClassRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/instructor', require('./routes/instructorRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/home', require('./routes/homeRoutes'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'EduTech API is operational' });
});

// Socket.io Signaling Logic
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-stream', ({ roomId, userId, userName, role }) => {
    socket.join(roomId);
    console.log(`${userName} (${role}) joined room: ${roomId}`);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    socket.to(roomId).emit('user-joined', { userId: socket.id, userName, role });
  });

  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('chat-message', ({ roomId, senderName, text, isHost }) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    socket.to(roomId).emit('chat-message', {
      id: Date.now(),
      name: senderName,
      text,
      time,
      isHost: !!isHost,
    });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        socket.to(roomId).emit('user-left', { userId: socket.id });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 EduTech API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
