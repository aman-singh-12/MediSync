// Main Express application: configure middleware and mount API routes.
// Exports `app` so the server starter can boot and tests can import it.
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const morgan = require('morgan');
const compression = require('compression'); 
const authRoutes = require('./routes/auth.routes');
const app = express();
app.use(compression());
app.use(morgan(':method :url :status :response-time ms'));
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
const { notFound, errorHandler } = require('./middleware/error.middleware');

const { apiLimiter } = require('./middleware/rateLimiter.middleware');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/', apiLimiter);
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/appointments', appointmentRoutes);

app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicalRecords', medicalRecordRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/sql', sqlAnalyticsRoutes);
app.use('/api/system', systemRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

module.exports = app;