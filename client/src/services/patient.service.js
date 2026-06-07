import api from "./api";

export const getMyPatientProfile = async () => {
	const response = await api.get("/api/patients/me");
	return response.data;
};

export const upsertMyPatientProfile = async (payload) => {
	const response = await api.put("/api/patients/me", payload);
	return response.data;
};

export const getPatientDashboard = async () => {
	const response = await api.get("/api/patients/dashboard");
	return response.data;
};

export const getSavedDoctors = async () => {
	const response = await api.get("/api/patients/saved-doctors");
	return response.data;
};

export const addSavedDoctor = async (doctorId) => {
	const response = await api.post(`/api/patients/saved-doctors/${doctorId}`);
	return response.data;
};

export const removeSavedDoctor = async (doctorId) => {
	const response = await api.delete(`/api/patients/saved-doctors/${doctorId}`);
	return response.data;
};
