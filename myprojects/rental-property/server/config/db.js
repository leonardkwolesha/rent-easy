const mongoose = require('mongoose');

const dropStaleIndexes = async () => {
  try {
    const usersCollection = mongoose.connection.collection('users');
    const indexes = await usersCollection.indexes();
    const stale = indexes.find(idx => idx.name === 'username_1');
    if (stale) {
      await usersCollection.dropIndex('username_1');
      console.log('Dropped stale username_1 index');
    }
  } catch (err) {
    // Index may not exist on a fresh DB — not a problem
  }
};

const seedAdmin = async () => {
  try {
    const User = require('../models/User');
    const ADMIN_EMAIL = 'admin@rentease.co.tz';
    const ADMIN_PASS  = 'Admin1234';

    // Remove any stale admin accounts then recreate with a fresh password hash
    await User.deleteMany({ role: 'admin' });
    await User.create({
      name: 'RentEase Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      role: 'admin',
      isVerified: true,
      isApproved: true,
    });
    console.log('──────────────────────────────────────');
    console.log('Admin account ready:');
    console.log('  Email:    ' + ADMIN_EMAIL);
    console.log('  Password: ' + ADMIN_PASS);
    console.log('──────────────────────────────────────');
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

const connectDB = async () => {
  let delay = 2000;
  while (true) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
      await dropStaleIndexes();
      await seedAdmin();
      return;
    } catch (err) {
      console.error(`DB connection failed, retrying in ${delay / 1000}s:`, err.message);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 60000);
    }
  }
};

module.exports = connectDB;
