// Appointment API Services: client-side HTTP calls for booking, cancelling, and rescheduling.
import api from "./api";

// ================= GET MY APPOINTMENTS =================
// 1. Fetch appointments for authenticated patient
export const getMyAppointments = async (params) => {
	const response = await api.get("/api/appointments/my", { params });
	return response.data;
};

// ================= BOOK APPOINTMENT =================
// 2. Book a new appointment slot
export const bookAppointment = async (data) => {
	const response = await api.post("/api/appointments/book", data);
	return response.data;
};

// ================= CANCEL APPOINTMENT =================
// 3. Cancel an existing appointment
export const cancelAppointment = async (appointmentId) => {
	const response = await api.put(`/api/appointments/cancel/${appointmentId}`);
	return response.data;
};

// ================= RESCHEDULE APPOINTMENT =================
// 4. Request appointment reschedule for a new date/time
export const rescheduleAppointment = async (appointmentId, data) => {
	const response = await api.put(`/api/appointments/reschedule/${appointmentId}`, data);
	return response.data;
};

// ================= GET DOCTOR APPOINTMENTS =================
// 5. Fetch appointments for authenticated doctor
export const getDoctorAppointments = async (params) => {
	const response = await api.get("/api/appointments/doctor", { params });
	return response.data;
};

// ================= GET ALL APPOINTMENTS (ADMIN) =================
// 6. Fetch all platform appointments (admin)
export const getAllAppointments = async (params) => {
	const response = await api.get("/api/appointments/all", { params });
	return response.data;
};

// ================= UPDATE APPOINTMENT STATUS =================
// 7. Update appointment status (confirm, complete, etc.)
export const updateAppointmentStatus = async (appointmentId, status, notes) => {
	const response = await api.put(`/api/appointments/status/${appointmentId}`, { status, notes });
	return response.data;
};


