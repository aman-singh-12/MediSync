import api from './api';

export const uploadProfilePicture = async (formData) => {
  const response = await api.post('/api/users/upload-profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMe = async (data) => {
  const response = await api.put('/api/users/me', data);
  return response.data;
};
