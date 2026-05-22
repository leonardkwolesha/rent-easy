require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ACCOUNTS = [
  { name: 'RentEase Admin',    email: 'admin@rentease.co.tz',    role: 'admin',    isVerified: true,  isApproved: true },
  { name: 'Test Landlord',     email: 'landlord@rentease.co.tz', role: 'landlord', isVerified: true,  isApproved: true },
  { name: 'Test Tenant',       email: 'tenant@rentease.co.tz',   role: 'tenant',   isVerified: true,  isApproved: true },
];
const PASSWORD = 'password123';

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to database:', mongoose.connection.db.databaseName);

  for (const acc of ACCOUNTS) {
    await User.deleteOne({ email: acc.email });
    const created = await User.create({ ...acc, password: PASSWORD });

    // Verify the hash works immediately after creation
    const fetched = await User.findById(created._id).select('+password');
    const ok = await fetched.comparePassword(PASSWORD);
    if (!ok) {
      console.error(`\nERROR: bcrypt hash verification failed for ${acc.email}`);
      process.exit(1);
    }

    console.log(`  ${acc.role.padEnd(9)} | ${acc.email.padEnd(30)} | hash OK`);
  }

  console.log('\n--- Test credentials (all use the same password) ---');
  console.log(`  Password: ${PASSWORD}`);
  ACCOUNTS.forEach(a => console.log(`  ${a.role.padEnd(9)} → ${a.email}`));
  console.log('\nGo to http://localhost:3002/login and sign in.');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
