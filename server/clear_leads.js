const mongoose = require('mongoose');
const Lead = require('./src/models/Lead');
const Delegate = require('./src/models/Delegate');
const connectDB = require('./src/config/db');
const DelegateService = require('./src/services/DelegateService');

connectDB().then(async () => {
  console.log('Cleaning up existing Google Sheets leads...');
  const result = await Lead.deleteMany({ source: 'Google Sheets' });
  console.log(`Successfully deleted ${result.deletedCount} Google Sheets leads.`);
  
  console.log('Syncing delegate stats...');
  const delegates = await Delegate.find({});
  for (const d of delegates) {
    await DelegateService.syncDelegateStats(d._id);
  }
  console.log('Delegate stats synced successfully.');
  
  process.exit(0);
}).catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
