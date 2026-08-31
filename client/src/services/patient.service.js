// Patient API Services: client-side HTTP calls for patient profile, dashboard, and saved doctors.
import api from "./api";

// ================= GET MY PATIENT PROFILE =================
// 1. Fetch current patient profile data
export const getMyPatientProfile = async () => {
	const response = await api.get("/api/patients/me");
	return response.data;
};

// ================= UPSERT PATIENT PROFILE =================
// 2. Create or update patient profile
export const upsertMyPatientProfile = async (payload) => {
	const response = await api.put("/api/patients/me", payload);
	return response.data;
};

// ================= GET PATIENT DASHBOARD =================
// 3. Fetch patient dashboard metrics and summary
export const getPatientDashboard = async () => {
	const response = await api.get("/api/patients/dashboard");
	return response.data;
};

// ================= GET SAVED DOCTORS =================
// 4. Fetch list of bookmarked/saved doctors
export const getSavedDoctors = async () => {
	const response = await api.get("/api/patients/saved-doctors");
	return response.data;
};

// ================= ADD SAVED DOCTOR =================
// 5. Bookmark/save a doctor by ID
export const addSavedDoctor = async (doctorId) => {
	const response = await api.post(`/api/patients/saved-doctors/${doctorId}`);
	return response.data;
};

// ================= REMOVE SAVED DOCTOR =================
// 6. Remove a bookmarked doctor by ID
export const removeSavedDoctor = async (doctorId) => {
	const response = await api.delete(`/api/patients/saved-doctors/${doctorId}`);
	return response.data;
};


