const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixmyarea');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
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
