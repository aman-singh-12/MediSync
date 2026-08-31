// Axios API Client: centralized HTTP instance with token injection and response interceptors.
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

export default api;

