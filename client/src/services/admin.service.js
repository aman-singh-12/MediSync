// Admin API Services: client-side HTTP calls for admin dashboard statistics.
import api from "./api";

// ================= GET ADMIN DASHBOARD STATS =================
// 1. Fetch system-wide summary metrics for admin dashboard
export const getAdminDashboardStats = async () => {
	const response = await api.get("/api/admin/dashboard");
	return response.data;
};


