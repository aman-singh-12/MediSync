import api from "./api";

export const getMyPayments = async () => {
	const response = await api.get("/api/payments/my");
	return response.data;
};

export const createPayment = async (payload) => {
	const response = await api.post("/api/payments", payload);
	return response.data;
};
