const mongoose = require('mongoose');
const adminService = require('./src/services/admin.service');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const stats = await adminService.getPlatformStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching stats:', error);
    process.exit(1);
  }
}

test();
