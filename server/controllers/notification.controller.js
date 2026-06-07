// Notification controller: fetch and manage user notifications.
const Notification = require('../models/notification.model');

// Get My Notifications
const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ recipient: req.user._id });
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark All as Read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark individual as Read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a notification (system/admin use)
const createNotification = async (req, res) => {
  try {
    const { recipient, type, title, message, data, link } = req.body;

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    const notification = await Notification.create({ recipient, type, title, message, data, link });
    return res.status(201).json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Internal helper
const createInternalNotification = async (recipient, title, message, type, link, data) => {
  try {
    await Notification.create({ recipient, title, message, type, link, data });
  } catch (error) {
    console.error('Notification Error:', error);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createInternalNotification
};
