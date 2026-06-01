const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('./db');
const env = require('./env');
const { ROLES } = require('../constants');

const seedSuperAdmin = async () => {
  try {
    console.log('[SEED] Connecting to database to seed Super Admin...');
    await connectDB();

    console.log(`[SEED] Checking if Super Admin already exists with email: ${env.SUPER_ADMIN_EMAIL}...`);
    const existingSuperAdmin = await User.findOne({ email: env.SUPER_ADMIN_EMAIL });

    if (existingSuperAdmin) {
      console.log('[SEED] Super Admin account already exists. Skipping creation.');
    } else {
      console.log('[SEED] No Super Admin found. Seeding a new Super Admin...');

      const newSuperAdmin = new User({
        name: 'Default Super Admin',
        email: env.SUPER_ADMIN_EMAIL,
        password: env.SUPER_ADMIN_PASSWORD, // This will be hashed by the User Schema pre-save hook!
        role: ROLES.SUPER_ADMIN,
        status: 'ACTIVE'
      });

      await newSuperAdmin.save();
      console.log('----------------------------------------------------');
      console.log('[SEED] SUPER ADMIN CREATED SUCCESSFULLY!');
      console.log(`[SEED] Email: ${env.SUPER_ADMIN_EMAIL}`);
      console.log(`[SEED] Password: ${env.SUPER_ADMIN_PASSWORD}`);
      console.log('----------------------------------------------------');
    }

    console.log('[SEED] Seeding script completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
