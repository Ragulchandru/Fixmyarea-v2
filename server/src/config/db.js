const mongoose = require('mongoose');

// Increase query buffering timeout to 30s to allow time for in-memory MongoDB downloading/booting
mongoose.set('bufferTimeoutMS', 30000);

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not defined.');
    }
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000 // Fail fast (5s) to trigger fallback/error before query buffering times out (10s)
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    // Disable in-memory fallback on Vercel / production environments
    const isVercel = !!process.env.VERCEL;
    const isProduction = process.env.NODE_ENV === 'production';

    if (isVercel || isProduction) {
      console.error('In-memory MongoDB fallback is disabled on Vercel/production.');
      throw error;
    }

    console.log('Attempting to launch an in-memory MongoDB fallback server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      console.log(`In-memory MongoDB started at: ${uri}`);
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected (In-Memory Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`In-Memory Fallback Failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
