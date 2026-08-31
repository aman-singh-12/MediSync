// Server entrypoint: loads environment, initializes database connections (MongoDB, Redis), Socket.IO, cron jobs, and starts HTTP server.
require('dotenv').config(); // Load environment variables first

const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./config/socket');
const { connectRedis } = require('./config/redis');
const initCronJobs = require('./cron/jobs');

// ================= DIRECTORY INITIALIZATION =================
// 1. Ensure local uploads directory exists for file storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;

// ================= CREATE HTTP & SOCKET.IO SERVER =================
// 2. Wrap Express app in Node.js HTTP server instance
const server = http.createServer(app);

// 3. Attach Socket.IO real-time event engine
initializeSocket(server);

// ================= BOOTSTRAP SYSTEM =================
const startServer = async () => {
  try {
    // 4. Connect to MongoDB and Redis caching layer
    await connectDB();
    await connectRedis();
    
    // 5. Initialize background cron jobs (e.g., appointment reminders)
    initCronJobs();

    // 6. Start listening on configured port
    server.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();