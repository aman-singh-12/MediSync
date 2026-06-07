// User model: authentication, roles, profile, OTP and wallet balance.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
      index: true,
    },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    passwordResetOtpVerifiedUntil: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    profilePicture: { type: String, default: '' },
    savedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);