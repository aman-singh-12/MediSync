// Doctor API Services: client-side HTTP calls for doctor search, profile, stats, and availability.
import api from "./api";

// ================= GET ALL DOCTORS =================
// 1. Fetch all approved doctors
export const getAllDoctors = async () => {
	const response = await api.get("/api/doctors");
	return response.data;
};

// ================= GET DOCTOR PROFILE =================
// 2. Fetch authenticated doctor's profile
export const getDoctorProfile = async () => {
	const response = await api.get("/api/doctors/profile/me");
	return response.data;
};

export const getMyDoctorProfile = getDoctorProfile;

// ================= UPSERT DOCTOR PROFILE =================
// 3. Create or update doctor profile details
export const upsertDoctorProfile = async (payload) => {
  const response = await api.post('/api/doctors/profile', payload);
  return response.data;
};

// ================= GET DOCTOR STATS =================
// 4. Fetch dashboard stats for authenticated doctor
export const getMyDoctorStats = async () => {
  const response = await api.get('/api/doctors/profile/me/stats');
  return response.data;
};

// ================= GET DOCTORS WITH FILTERS =================
// 5. Search doctors with custom query filters (specialization, fee, hospital)
export const getDoctors = async (filters = {}) => {
  try {
    const response = await api.get("/api/doctors", { params: filters });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    throw error;
  }
};

// ================= GET AVAILABLE SLOTS BY DATE =================
// 6. Fetch available unbooked time slots for a doctor on a specific date
export const getAvailableSlotsByDate = async (doctorId, date) => {
  const response = await api.get(`/api/doctors/${doctorId}/available-slots`, { params: { date } });
  return response.data;
};


