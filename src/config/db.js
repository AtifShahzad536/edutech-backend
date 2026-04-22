const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(require('./env').MONGODB_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log('💡 Tip: Ensure MongoDB is running locally or check your MONGODB_URI in .env');
  }
};

module.exports = connectDB;
