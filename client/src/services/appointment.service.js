import api from "./api";

export const getMyAppointments = async (params) => {
	const response = await api.get("/api/appointments/my", { params });
	return response.data;
};

export const bookAppointment = async (data) => {
	const response = await api.post("/api/appointments/book", data);
	return response.data;
};

export const cancelAppointment = async (appointmentId) => {
	const response = await api.put(`/api/appointments/cancel/${appointmentId}`);
	return response.data;
};

export const rescheduleAppointment = async (appointmentId, data) => {
	const response = await api.put(`/api/appointments/reschedule/${appointmentId}`, data);
	return response.data;
};

export const getDoctorAppointments = async (params) => {
	const response = await api.get("/api/appointments/doctor", { params });
	return response.data;
};

export const getAllAppointments = async (params) => {
	const response = await api.get("/api/appointments/all", { params });
	return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status, notes) => {
	const response = await api.put(`/api/appointments/status/${appointmentId}`, { status, notes });
	return response.data;
};
