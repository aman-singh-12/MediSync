// User API Services: client-side HTTP calls for user profile updates and avatar upload.
import api from './api';

// ================= UPLOAD PROFILE PICTURE =================
// 1. Upload user profile picture (multipart/form-data)
export const uploadProfilePicture = async (formData) => {
  const response = await api.post('/api/users/upload-profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ================= UPDATE USER PROFILE =================
// 2. Update user name/phone profile details
export const updateMe = async (data) => {
  const response = await api.put('/api/users/me', data);
  return response.data;
};


