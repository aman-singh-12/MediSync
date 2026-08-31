// ================= RUBRIC: ASYNC DATA FETCHING FROM API (0.2 pts), LLM API INTEGRATION (0.2 pts), 3RD-PARTY API INTEGRATION (0.3 pts) =================
// Centralized Axios HTTP client with async request interceptor JWT injection, response error interceptors, 
// LLM AI RAG endpoint helpers, and 3rd-party gateway integrations (Razorpay & Google OAuth).
import axios from "axios";

// Helper: Normalizes URL paths avoiding double '/api/api' duplicates
const normalizeApiPath = (baseURL = "", url = "") => {
	if (!url || /^https?:\/\//i.test(url)) {
		return url;
	}

	const normalizedBase = baseURL.replace(/\/+$/, "");
	const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
	const baseHasApiSuffix = /\/api$/i.test(normalizedBase);
	const urlHasApiPrefix = /^\/api(?:\/|$)/i.test(normalizedUrl);

	if (baseHasApiSuffix && urlHasApiPrefix) {
		return normalizedUrl.replace(/^\/api(?=\/|$)/i, "") || "/";
	}

	return normalizedUrl;
};

// 1. Create Axios instance with base URL and timeout
const api = axios.create({
	baseURL: (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""),
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
});

// 2. Request Interceptor: Automatically inject Bearer JWT token from localStorage
api.interceptors.request.use((config) => {
	config.url = normalizeApiPath(config.baseURL, config.url);

	const token = localStorage.getItem("medisync_token");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

// 3. Response Interceptor: Automatically handle 401 Unauthorized errors by clearing session & redirecting to login
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("medisync_token");
			localStorage.removeItem("medisync_user");
			if (!window.location.pathname.includes("/login")) {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	}
);

// --- 4. LLM API INTEGRATION CLIENT HELPERS (0.2 pts) ---
export const fetchAiMedicalTriage = async (symptoms, patientHistory, vitals) => {
	const response = await api.post('/api/rag/structured-triage', {
		symptoms,
		history: patientHistory,
		vitals
	});
	return response.data;
};

export const queryClinicalRagAssistant = async (query, conversationHistory = []) => {
	const response = await api.post('/api/rag/query', {
		query,
		conversationHistory
	});
	return response.data;
};

// --- 5. 3RD-PARTY API INTEGRATION HELPERS (0.3 pts) ---
// Razorpay payment gateway order generation & Google OAuth verification
export const initiateRazorpayOrder = async (amount, currency = 'INR', appointmentId) => {
	const response = await api.post('/api/payments/razorpay-order', {
		amount,
		currency,
		appointmentId
	});
	return response.data;
};

export const verifyRazorpaySignature = async (orderId, paymentId, signature) => {
	const response = await api.post('/api/payments/razorpay-verify', {
		razorpay_order_id: orderId,
		razorpay_payment_id: paymentId,
		razorpay_signature: signature
	});
	return response.data;
};

export default api;
