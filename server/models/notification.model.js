// Notification model: messages and alerts sent to users.
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'alert', 'appointment', 'prescription', 'payment', 'medical_record', 'system'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String,
    data: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
