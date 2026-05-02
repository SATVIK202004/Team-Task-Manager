const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    console.error('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
