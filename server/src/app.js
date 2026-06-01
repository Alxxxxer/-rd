const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('./middlewares/cookieParser');
const { authLimiter } = require('./middlewares/rateLimiter');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const AppError = require('./utils/errors');
const env = require('./config/env');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const delegateRoutes = require('./routes/delegateRoutes');

const app = express();

// 1. GLOBAL MIDDLEWARES
// Security Headers
app.use(helmet());

// Enable CORS with secure options
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Allow cookies to be sent back and forth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsers
app.use(express.json({ limit: '10kb' })); // Limits request payload sizes for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom Cookie Parser
app.use(cookieParser);

// 2. ENDPOINT MAPPINGS
// Apply rate limiter specifically to auth routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/delegates', delegateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CRM API Server is healthy and running',
    timestamp: new Date()
  });
});

// 3. 404 ROUTE CATCH-ALL
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. CENTRALIZED ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
