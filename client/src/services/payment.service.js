// Payment API Services: client-side HTTP calls for transactions and payments.
import api from "./api";

// ================= GET MY PAYMENTS =================
// 1. Fetch authenticated user's payment history
export const getMyPayments = async () => {
	const response = await api.get("/api/payments/my");
	return response.data;
};

// ================= CREATE PAYMENT =================
// 2. Submit payment creation / transaction record
export const createPayment = async (payload) => {
	const response = await api.post("/api/payments", payload);
	return response.data;
};


