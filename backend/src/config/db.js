const mongoose = require('mongoose');

// Disable query buffering globally so operations fail fast if DB is offline
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_procurement_db';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database Notice] MongoDB server unavailable (${error.message}). Backend fallback store active.`);
  }
};

module.exports = connectDB;
