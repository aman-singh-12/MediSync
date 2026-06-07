import api from "./api";

export const getAllDoctors = async () => {
	const response = await api.get("/api/doctors");
	return response.data;
};

export const getDoctorProfile = async () => {
	const response = await api.get("/api/doctors/profile/me");
	return response.data;
};

export const getMyDoctorProfile = getDoctorProfile;

export const upsertDoctorProfile = async (payload) => {
  const response = await api.post('/api/doctors/profile', payload);
  return response.data;
};

export const getMyDoctorStats = async () => {
  const response = await api.get('/api/doctors/profile/me/stats');
  return response.data;
};

export const getDoctors = async (filters = {}) => {
  try {
    const response = await api.get("/api/doctors", { params: filters });
    // Handle standard response structure where data is wrapped in a 'data' field or returned directly
    return response.data?.data || response.data;
  } catch (error) {
    // For development, if API fails, we could return mock data or throw
    console.error("Failed to fetch doctors:", error);
    throw error;
  }
};
export const getAvailableSlotsByDate = async (doctorId, date) => {
  const response = await api.get(`/api/doctors/${doctorId}/available-slots`, { params: { date } });
  return response.data;
};
