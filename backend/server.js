require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const validateEnv = require('./src/config/envValidator');

// Validate critical environment variables on startup
validateEnv();

const PORT = process.env.PORT || 5001;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication token required for Socket connection.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_sih_2026_gov_key_change_in_production');
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

// Start Server & Connect DB
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🌾 AgriNexus API & Command Centre`);
    console.log(` 🚀 Server listening on port ${PORT}`);
    console.log(` 🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(` 🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

startServer();
