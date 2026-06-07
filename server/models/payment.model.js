// Payment model: stores payment and refund transactions for appointments.
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    doctorName: { type: String, trim: true, default: '' },
    specialty: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'INR' },
    type: {
      type: String,
      enum: ['payment', 'refund'],
      default: 'payment'
    },
    transactionType: {
      type: String,
      enum: ['debit', 'credit'],
      default: 'debit'
    },
    method: {
      type: String,
      enum: ['card', 'bank', 'cash', 'upi', 'wallet', 'other'],
      default: 'card',
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'pending',
    },
    referenceId: { type: String, required: true, unique: true },
    paidAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: '' },
    metadata: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
