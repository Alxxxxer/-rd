const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true, // Build indexes in dev/production
    });

    console.log(`[DATABASE] MongoDB Connected successfully: ${conn.connection.host}`);
    
    // Drop legacy unique index on delegates user field if it exists
    try {
      await mongoose.connection.db.collection('delegates').dropIndex('user_1');
      console.log('[DATABASE] Dropped legacy unique index user_1 on delegates collection successfully.');
    } catch (err) {
      // Safe to ignore if index does not exist or has already been dropped
    }
    
    // Handle run-time database connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[DATABASE] MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DATABASE] MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error(`[DATABASE] MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
