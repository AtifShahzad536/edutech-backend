const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('📡 Using existing MongoDB connection');
    return;
  }
  
  try {
    const conn = await mongoose.connect(require('./env').MONGODB_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log('💡 Tip: Ensure your MONGODB_URI is set correctly in Vercel environment variables.');
  }
};

module.exports = connectDB;
