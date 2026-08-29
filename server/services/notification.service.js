const Notification = require('../models/notification.model');

/**
 * Create a new notification for a user
 * @param {Object} params - Notification parameters { recipient, type, title, message, data, link }
 */
const createNotification = async (params) => {
	try {
		const notification = await Notification.create(params);
		return notification;
	} catch (error) {
		console.error('Error creating notification:', error);
		return null;
	}
};

module.exports = { createNotification };
