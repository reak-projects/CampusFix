const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusfix?directConnection=true';

  try {
    await mongoose.connect(mongoUri, {
      driverInfo: { name: 'nodejs', version: process.version || '24.0.0' },
    });
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = { connectDB };
