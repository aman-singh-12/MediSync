// Main Express application: configure middleware, security, and mount API routes.
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const morgan = require('morgan');
const compression = require('compression'); 
const { xssSanitizer, mongoSanitizer } = require('./middleware/sanitize.middleware');

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const doctorRoutes = require('./routes/doctor.routes');
const reviewRoutes = require('./routes/review.routes');
const patientRoutes = require('./routes/patient.routes');
const paymentRoutes = require('./routes/payment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const ragRoutes = require('./routes/rag.routes');
const sqlAnalyticsRoutes = require('./routes/sqlAnalytics.routes');
const systemRoutes = require('./routes/system.routes');

// Import Middleware
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();
app.set('trust proxy', 1); // Trust the reverse proxy (Render) to correctly resolve client IP for rate limiting

// ================= VIEW ENGINE (SSR DEMO) =================
// Configure Server-Side Rendering (SSR) view engine using EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ================= GLOBAL MIDDLEWARES =================
// 1. Gzip compression for high-performance HTTP responses
app.use(compression());

// 2. HTTP request logging
app.use(morgan(':method :url :status :response-time ms'));

// 3. Cross-Origin Resource Sharing (CORS) & JSON body parser
const allowedOrigins = [
  'https://medi-sync-7zpm.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches known allowed origins or Vercel preview URLs
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// 4. Security: Input Sanitization (Protects against XSS and NoSQL Query Injection)
app.use(xssSanitizer);
app.use(mongoSanitizer);

// 5. Static file hosting for uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Global API Rate Limiting (200 req / 15 min)
app.use('/api/', apiLimiter);

// ================= HEALTH & SSR ROUTES =================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// SSR Demonstration Route: Renders downloadable/printable medical invoice template
app.get('/invoice/:id', (req, res) => {
  res.render('invoice', {
    invoiceId: req.params.id,
    date: new Date().toLocaleDateString(),
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    doctorName: 'Dr. Smith',
    amount: '150.00'
  });
});

// ================= MOUNT API ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medicalRecords', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/sql', sqlAnalyticsRoutes);
app.use('/api/system', systemRoutes);

// ================= ERROR HANDLING MIDDLEWARE =================
app.use(notFound);
app.use(errorHandler);

// Production Static Serving for React SPA Frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

module.exports = app;