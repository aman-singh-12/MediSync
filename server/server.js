// Server entrypoint: load environment variables, connect to MongoDB,
// ensure `uploads/` exists, and start the HTTP server on `PORT`.
require('dotenv').config(); // 🔥 MUST BE FIRST

const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./config/socket');

const { connectRedis } = require('./config/redis');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();