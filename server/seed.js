const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const connectDB = require('./config/db');

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = '2200040029ece@gmail.com';
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'satvik',
        role: 'admin',
        isVerified: true
      });
      console.log('Admin account seeded successfully');
    } else {
      console.log('Admin account already exists, skipping seed');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = seedAdmin;
