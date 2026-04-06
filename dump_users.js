const mongoose = require('mongoose');
require('dotenv').config();

const dumpUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Edutech');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('--- USERS IN DB ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

dumpUsers();
