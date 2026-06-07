import api from './api';

export const getMyNotifications = async () => {
  const response = await api.get('/api/notifications/my');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/api/notifications/${id}/read`);
  return response.data;
};
