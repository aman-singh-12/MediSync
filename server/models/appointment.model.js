// Appointment model: scheduling records (patient, doctor, date/time, status).
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    requestedDate: { type: String, default: null },
    requestedTime: { type: String, default: null },
    reason: { type: String, trim: true, default: '' },
    consultationFee: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    diagnosis: { type: String, default: '' },
    rescheduleReason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['booked', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'reschedule_requested'],
      default: 'booked',
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['prepaid', 'pay_later'],
      default: 'prepaid',
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } });

module.exports = mongoose.model('Appointment', appointmentSchema);