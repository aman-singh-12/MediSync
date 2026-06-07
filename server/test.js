require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Appointment = require('./models/appointment.model');
const Doctor = require('./models/doctor.model');
const Patient = require('./models/patient.model');
const Payment = require('./models/payment.model');
const User = require('./models/user.model');
const crypto = require('crypto');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medisync');
    
    // Get a patient user
    const patientUser = await User.findOne({ role: 'patient' });
    const patientProfile = await Patient.findOne({ user: patientUser._id });
    
    // Get a doctor
    const doctor = await Doctor.findOne();
    const doctorUser = await User.findById(doctor.user);
    
    const date = '2026-06-25';
    const time = '10:00';
    const consultationFee = doctor.consultationFee || 0;
    const paymentMode = 'prepaid';
    
    console.log('Testing bookAppointment logic...');
    
    const appointment = await Appointment.create({
      patient: patientProfile._id,
      doctor: doctor._id,
      date,
      time,
      reason: 'Test',
      consultationFee,
      paymentMode,
    });
    console.log('Appointment created', appointment._id);

    try {
      const payment = await Payment.create({
        patient: patientProfile._id,
        doctor: doctor._id,
        appointment: appointment._id,
        doctorName: doctorUser?.name || 'Doctor',
        specialty: doctor.specialization || 'General',
        amount: consultationFee,
        method: paymentMode === 'wallet' ? 'wallet' : 'card',
        status: 'paid',
        referenceId: `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        paidAt: new Date(),
        notes: `Appointment booking on ${date} at ${time} via ${paymentMode}`
      });
      console.log('Payment created', payment._id);
    } catch (e) {
      console.error('Payment creation failed:', e.message);
    }
    
    await Appointment.findByIdAndDelete(appointment._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
})();
