import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './db.js';

// Import routes
import appointmentRoutes from './routes/appointments.js';
import studentRoutes from './routes/students.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:'],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://your-frontend-domain.com']
      : ['http://localhost:3000', 'http://localhost:5173'], // React and Vite default ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/students', studentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Tutor Booking API',
    version: '1.0.0',
    documentation: '/api/v1',
    health: '/health',
  });
});

// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Tutor Booking API v1',
    endpoints: {
      appointments: {
        'GET /api/v1/appointments': 'Get all appointments for a student',
        'GET /api/v1/appointments/available-slots': 'Get available time slots',
        'POST /api/v1/appointments': 'Book a new appointment',
        'PUT /api/v1/appointments/:id': 'Update an existing appointment',
        'DELETE /api/v1/appointments/:id': 'Cancel an appointment',
      },
      students: {
        'GET /api/v1/students': 'Get all students',
        'GET /api/v1/students/:id': 'Get a specific student by ID',
      },
      health: {
        'GET /health': 'API health check',
      },
    },
    requestFormat: {
      'POST /api/v1/appointments': {
        dateTime: 'ISO 8601 string (e.g., "2024-01-15T10:00:00.000Z")',
        tutorId: 'integer',
        studentId: 'integer (optional, defaults to 1)',
        notes: 'string (optional, max 500 chars)',
      },
      'PUT /api/v1/appointments/:id': {
        dateTime: 'ISO 8601 string (optional)',
        notes: 'string (optional, max 500 chars)',
      },
    },
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: '/api/v1',
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle specific error types
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body too large',
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error,
    }),
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error(
      '❌ Could not close connections in time, forcefully shutting down'
    );
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, async () => {
  console.log('\n🚀 Tutor Booking API Server Starting...');
  console.log('=====================================');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error(
      '❌ Failed to connect to database. Please check your DATABASE_URL in .env file'
    );
    console.log('\n📝 To set up the database, run: npm run setup-db');
  }

  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/v1`);
  console.log('=====================================\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
