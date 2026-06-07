import api from "./api";

export const getAdminDashboardStats = async () => {
	const response = await api.get("/api/admin/dashboard");
	return response.data;
};
