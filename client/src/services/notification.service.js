// Notification API Services: client-side HTTP calls for retrieving and acknowledging notifications.
import api from './api';

// ================= GET MY NOTIFICATIONS =================
// 1. Fetch current user notifications
export const getMyNotifications = async () => {
  const response = await api.get('/api/notifications/my');
  return response.data;
};

// ================= MARK NOTIFICATION AS READ =================
// 2. Mark specific notification as read by ID
export const markNotificationRead = async (id) => {
  const response = await api.put(`/api/notifications/${id}/read`);
  return response.data;
};


