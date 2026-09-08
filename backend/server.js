const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const env = require('./src/config/env');
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Ensure uploads directory exists on Render (ephemeral filesystem) and local dev
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// Strictly validate required environment configuration on server startup
env.validateConfig();

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Server with Production-Ready CORS & Multi-Transport Support
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow non-browser socket clients (e.g. mobile apps, test runners)
      if (!origin) return callback(null, true);

      const allowed = env.SOCKET_CORS_ORIGINS;
      if (allowed.includes('*') || allowed.includes(origin)) {
        return callback(null, true);
      }

      // Support Vercel deployment domains
      if (origin.endsWith('.vercel.app') && allowed.some((o) => o.includes('vercel.app'))) {
        return callback(null, true);
      }

      // Allow localhost in development
      if (!env.IS_PRODUCTION && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      return callback(new Error(`[Socket.IO] CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication token required for Socket connection.'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid Socket authorization token.'));
  }
});

// Socket.IO Channel Event Handlers with Security Verification
io.on('connection', (socket) => {
  const userId = socket.user?.userId;
  const role = socket.user?.role;

  console.log(`[Socket.IO] Authenticated client connected: ${socket.id} (User: ${userId}, Role: ${role})`);

  // Room Subscription Handlers
  socket.on('join_centre', (centreId) => {
    socket.join(`centre_${centreId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: centre_${centreId}`);
  });

  socket.on('join_farmer', (farmerId) => {
    if (role === 'FARMER' && userId !== farmerId) {
      console.warn(`[Socket Security Warning] Farmer ${userId} attempted to join unauthorized room farmer_${farmerId}`);
      return;
    }
    socket.join(`farmer_${farmerId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: farmer_${farmerId}`);
  });

  socket.on('join_admin', () => {
    if (role !== 'ADMIN') {
      console.warn(`[Socket Security Warning] Non-admin user ${userId} attempted to join admin room`);
      return;
    }
    socket.join('admin_global');
    console.log(`[Socket.IO] Admin socket ${socket.id} joined admin_global room`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Attach Socket.IO instance to app for controller/service access
app.set('io', io);

// Start Server & Connect DB (Binds to 0.0.0.0 for Render hosting compatibility)
const startServer = async () => {
  await connectDB();
  
  server.listen(env.PORT, env.HOST, () => {
    console.log(`=======================================================`);
    console.log(` 🌾 AgriNexus API & Command Centre Server`);
    console.log(` 🚀 Listening on ${env.HOST}:${env.PORT}`);
    console.log(` 🔗 Health check: http://localhost:${env.PORT}/api/health`);
    console.log(` 🌐 Frontend CORS Allowed: ${env.CORS_ORIGINS.join(', ')}`);
    console.log(` 🛡️  Environment: ${env.NODE_ENV}`);
    console.log(`=======================================================`);
  });
};

startServer();

module.exports = { server, app, io };
