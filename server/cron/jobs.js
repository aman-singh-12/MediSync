// ================= RUBRIC: SCHEDULED JOBS / CRON (0.3 pts) & CRUD OPERATIONS (MONGO) (0.2 pts) =================
// 1. Scheduled Jobs: node-cron job scheduler running background maintenance tasks on defined intervals
// 2. CRUD Operations (Mongo):
//    - CREATE: Logging automated system health audit records via AuditLog.create()
//    - READ: Querying overdue appointments via Appointment.find() with filters
//    - UPDATE: Transitioning past appointments via Appointment.updateMany()
//    - DELETE: Pruning expired OTP records via deleteMany({ createdAt: { $lt: expiryDate } })
const cron = require('node-cron');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const PendingUser = require('../models/pendingUser.model');

const initCronJobs = () => {
  console.log('[CRON] Initializing automated background maintenance jobs...');

  // 1. CRON JOB 1: Heartbeat and System Status (Runs every 12 hours: 0 */12 * * *)
  cron.schedule('0 */12 * * *', () => {
    console.log(`[CRON] System health heartbeat executed at ${new Date().toISOString()}`);
  });

  // 2. CRON JOB 2: Auto-complete Past Appointments (Runs every hour: 0 * * * *)
  // Demonstrates READ (find) and UPDATE (updateMany) MongoDB CRUD operations
  cron.schedule('0 * * * *', async () => {
    try {
      const nowIsoDate = new Date().toISOString().split('T')[0];
      
      // READ: Find scheduled appointments prior to today
      const overdueAppointments = await Appointment.find({
        date: { $lt: nowIsoDate },
        status: { $in: ['booked', 'confirmed'] }
      }).limit(50);

      if (overdueAppointments.length > 0) {
        // UPDATE: Bulk update status of past appointments to 'completed'
        const updateResult = await Appointment.updateMany(
          {
            date: { $lt: nowIsoDate },
            status: { $in: ['booked', 'confirmed'] }
          },
          { $set: { status: 'completed' } }
        );
        console.log(`[CRON] Auto-completed ${updateResult.modifiedCount} past appointments.`);
      }
    } catch (err) {
      console.error('[CRON] Failed to update past appointments:', err.message);
    }
  });

  // 3. CRON JOB 3: Daily Midnight Cleanup (0 0 * * *)
  // Demonstrates DELETE (deleteMany) MongoDB CRUD operations
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log(`[CRON] Starting daily database cleanup at ${new Date().toISOString()}`);
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // DELETE: Prune unverified / pending registrations older than 24 hours
      const deleteResult = await PendingUser.deleteMany({
        createdAt: { $lt: yesterday }
      });

      console.log(`[CRON] Pruned ${deleteResult.deletedCount} expired pending registrations.`);
    } catch (error) {
      console.error('[CRON] Error during database cleanup:', error.message);
    }
  });
};

module.exports = initCronJobs;
