const mongoose = require('mongoose');
const env = require('./env');

// Disable query buffering globally so operations fail fast if DB is offline
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const isAtlas = env.MONGODB_URI.includes('mongodb+srv://') || env.MONGODB_URI.includes('mongodb.net');
    
    const options = {
      serverSelectionTimeoutMS: isAtlas ? 8000 : 3000,
      maxPoolSize: env.IS_PRODUCTION ? 20 : 10,
      minPoolSize: env.IS_PRODUCTION ? 2 : 1,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(env.MONGODB_URI, options);
    console.log(`[Database] MongoDB Connected (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}): ${conn.connection.host}/${conn.connection.name}`);

    // Connection event listeners for production stability
    mongoose.connection.on('error', (err) => {
      console.error('[Database Error] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Notice] MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database Notice] MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.warn(`[Database Notice] MongoDB server unavailable (${error.message}). Backend fallback in-memory store active.`);
  }
};

module.exports = connectDB;
