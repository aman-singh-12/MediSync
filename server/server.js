// Server entrypoint: load environment variables, connect to MongoDB,
// ensure `uploads/` exists, and start the HTTP server on `PORT`.
require('dotenv').config(); // 🔥 MUST BE FIRST

const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});