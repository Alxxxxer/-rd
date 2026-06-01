const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true, // Build indexes in dev/production
    });

    console.log(`[DATABASE] MongoDB Connected successfully: ${conn.connection.host}`);
    
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
