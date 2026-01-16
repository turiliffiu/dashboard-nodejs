require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const procedureRoutes = require('./routes/procedure.routes');
const userRoutes = require('./routes/user.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();

// ====================
// Security Middleware
// ====================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
  })
);

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minuti
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Troppi richieste da questo IP, riprova più tardi',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting più restrittivo per auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 richieste
  message: 'Troppi tentativi di login, riprova tra 15 minuti',
});

// ====================
// Body Parsers
// ====================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================
// Request Logging (Development)
// ====================

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ====================
// Health Check
// ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ====================
// API Routes
// ====================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

// ====================
// API Documentation
// ====================

app.get('/api', (req, res) => {
  res.json({
    message: 'Dashboard Procedure Operative - API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
        me: 'GET /api/auth/me',
      },
      procedures: {
        list: 'GET /api/procedures',
        get: 'GET /api/procedures/:id',
        create: 'POST /api/procedures',
        update: 'PUT /api/procedures/:id',
        updateFile: 'PUT /api/procedures/:id/file',
        delete: 'DELETE /api/procedures/:id',
        download: 'GET /api/procedures/:id/download',
      },
      users: {
        list: 'GET /api/users (Admin)',
        get: 'GET /api/users/:id (Admin)',
        me: 'GET /api/users/me',
        updateMe: 'PUT /api/users/me',
        updateRole: 'PATCH /api/users/:id/role (Admin)',
        toggleActive: 'PATCH /api/users/:id/active (Admin)',
        delete: 'DELETE /api/users/:id (Admin)',
      },
      search: {
        search: 'GET /api/search?q=<query>',
      },
    },
    documentation: '/api-docs',
  });
});

// ====================
// Error Handlers
// ====================

// 404 - Not Found
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

module.exports = app;
