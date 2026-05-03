const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');
const globalErrorHandler = require('./middleware/errorController');
const AppError = require('./utils/appError');
const routes = require('./routes');
const { globalLimiter, burstLimiter } = require('./middleware/rateLimiter');

const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers (Enterprise Best Practice)
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Limit requests from same API (DDoS Protection)
app.use('/api', globalLimiter);
app.use('/api', burstLimiter);

// Stripe Webhook MUST be routed before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').handleWebhook);

// Body parser, reading data from body into req.body (Max 10kb to prevent memory exhaustion)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
// (Prevents malicious attempts to crash the DB with complex queries)
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 
    'maxGroupSize', 'difficulty', 'price'
  ]
}));

// Implement CORS
app.use(cors());
app.options('*', cors());

const maintenanceMiddleware = require('./middleware/maintenance');

// 2) ROUTES
app.use('/api', maintenanceMiddleware, routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'EduTech API is operational' });
});

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) ERROR HANDLING
app.use(globalErrorHandler);

module.exports = app;
