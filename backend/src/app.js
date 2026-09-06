const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const env = require('./config/env');
const bhashiniService = require('./services/bhashiniService');

const authRoutes = require('./routes/authRoutes');
const centreRoutes = require('./routes/centreRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const queueRoutes = require('./routes/queueRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffApplicationRoutes = require('./routes/staffApplicationRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const bhashiniRoutes = require('./routes/bhashiniRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security Headers
app.use(helmet());

// Dynamic, Multi-Origin CORS Configuration (Supporting Vercel, Localhost & Custom Domains)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (server-to-server, mobile, curl, Postman, health check)
    if (!origin) return callback(null, true);

    const allowed = env.CORS_ORIGINS;
    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }

    // Support Vercel production and preview deployments
    const isVercelOrigin = origin.endsWith('.vercel.app') && allowed.some((o) => o.includes('vercel.app'));
    if (isVercelOrigin) {
      return callback(null, true);
    }

    // Allow localhost/127.0.0.1 in non-production
    if (!env.IS_PRODUCTION && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Production Health Check Endpoint (Safe, Non-Sensitive Diagnostic Information)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AgriNexus Digital Procurement Platform API',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'in-memory-fallback',
    bhashini: bhashiniService.isConfigured() ? 'configured' : 'fallback-mode'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff/applications', staffApplicationRoutes);
app.use('/api/admin/staff-applications', adminApplicationRoutes);
app.use('/api/bhashini', bhashiniRoutes);
app.use('/api/mandis', mandiRoutes);

// 404 Not Found Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
