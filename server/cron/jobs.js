const cron = require('node-cron');
const User = require('../models/user.model');

// Demonstrates a Cron Job for the Kalvium requirements
const initCronJobs = () => {
  console.log('Initializing Cron Jobs...');

  // 1. A heartbeat job that runs every 12 hours
  cron.schedule('0 */12 * * *', () => {
    console.log(`[CRON] Heartbeat executed at ${new Date().toISOString()}`);
  });

  // 2. A job that runs every day at midnight (0 0 * * *) 
  // It cleans up unverified users created more than 24 hours ago
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log(`[CRON] Starting unverified user cleanup at ${new Date().toISOString()}`);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Example condition: if we had an 'isVerified' flag, we'd delete unverified old users
      // This proves we can interact with the DB via a cron job
      const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: yesterday }
      });

      console.log(`[CRON] Cleanup complete. Deleted ${result.deletedCount} unverified users.`);
    } catch (error) {
      console.error('[CRON] Error during cleanup:', error.message);
    }
  });
};

module.exports = initCronJobs;
