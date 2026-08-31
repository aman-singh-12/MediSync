// Notification controller: fetch and manage user notifications.
const Notification = require('../models/notification.model');

// ================= GET MY NOTIFICATIONS =================
// Logic: Retrieves paginated notifications received by the authenticated user, sorted newest first
const getMyNotifications = async (req, res) => {
  try {
    // 1. Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Query paginated notifications for current user
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

// ================= MARK ALL AS READ =================
// Logic: Updates all unread notifications for current user to isRead: true
const markAllAsRead = async (req, res) => {
  try {
    // 1. Bulk update unread notifications
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= MARK AS READ =================
// Logic: Verifies notification recipient ownership and marks single notification as read
const markAsRead = async (req, res) => {
  try {
    // 1. Find notification by ID
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // 2. Ensure only the intended recipient can mark it read
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 3. Mark read and save
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE NOTIFICATION =================
// Logic: Creates a new notification record via API request (admin/system use)
const createNotification = async (req, res) => {
  try {
    // 1. Extract payload
    const { recipient, type, title, message, data, link } = req.body;

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    // 2. Create notification document
    const notification = await Notification.create({ recipient, type, title, message, data, link });
    return res.status(201).json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ================= CREATE INTERNAL NOTIFICATION =================
// Logic: Server-side helper to create notifications without HTTP context
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
