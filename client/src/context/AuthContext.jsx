// ================= RUBRIC: OAUTH / 3RD-PARTY LOGIN (0.2 pts) & CONTEXT STATE MANAGEMENT =================
// Manages Google OAuth 2.0 OpenID Connect credential exchanges, session token lifecycle, and reactive user state
import { createContext, useCallback, useMemo, useState } from "react";
import { loginUser, googleLoginUser } from "../services/authService";
import api from "../services/api";

const TOKEN_KEY = "medisync_token";
const USER_KEY = "medisync_user";

// Safe localStorage helper functions with error handling
const safeGetItem = (key) => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const safeSetItem = (key, value) => {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Ignore storage write failures to keep UI functional
	}
};

const safeRemoveItem = (key) => {
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore storage deletion failures to keep UI functional
	}
};

// Read saved authentication token from localStorage
const readStoredToken = () => {
	const rawToken = safeGetItem(TOKEN_KEY);

	if (!rawToken || rawToken === "undefined" || rawToken === "null") {
		return "";
	}

	return String(rawToken);
};

// Read saved user profile from localStorage
const readStoredUser = () => {
	try {
		const rawUser = safeGetItem(USER_KEY);
		return rawUser ? JSON.parse(rawUser) : null;
	} catch {
		return null;
	}
};

// Normalizes token and user fields from diverse API responses
const extractSessionFromAuthPayload = (data, fallbackUser = {}) => {
	const nextToken =
		data?.token || data?.accessToken || data?.data?.token || data?.data?.accessToken;

	const nextUser =
		data?.user ||
		data?.data?.user ||
		(data?._id || data?.email
			? {
				_id: data?._id,
				name: data?.name,
				email: data?.email,
				role: data?.role || fallbackUser?.role || "patient",
				profilePicture: data?.profilePicture || fallbackUser?.profilePicture || "",
			}
			: {
				email: fallbackUser?.email || "",
				role: fallbackUser?.role || "patient",
				profilePicture: fallbackUser?.profilePicture || "",
			});

	return { nextToken, nextUser };
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	// ================= AUTH STATE INITIALIZATION =================
	// 1. Initialize auth state from local storage
	const [token, setToken] = useState(() => readStoredToken());
	const [user, setUser] = useState(() => readStoredUser());
	const [authLoading, setAuthLoading] = useState(false);

	// ================= PERSIST SESSION =================
	// 2. Persist session token and user profile into state and localStorage
	const persistSession = useCallback((nextToken, nextUser) => {
		const normalizedToken = String(nextToken || "");
		setToken(normalizedToken);
		setUser(nextUser);
		safeSetItem(TOKEN_KEY, normalizedToken);
		safeSetItem(USER_KEY, JSON.stringify(nextUser));
	}, []);

	// ================= CLEAR SESSION (LOGOUT) =================
	// 3. Clear session data upon logout
	const clearSession = useCallback(() => {
		setToken("");
		setUser(null);
		safeRemoveItem(TOKEN_KEY);
		safeRemoveItem(USER_KEY);
	}, []);

	// ================= LOGIN HANDLER =================
	// 4. Standard email & password login handler
	const login = useCallback(
		async (credentials) => {
			setAuthLoading(true);
			try {
				const data = await loginUser(credentials);
				const { nextToken, nextUser } = extractSessionFromAuthPayload(data, {
					email: credentials.email,
					role: "patient",
				});

				if (!nextToken) {
					throw new Error("Login succeeded but token was not returned.");
				}

				persistSession(nextToken, nextUser);
				return { success: true, data };
			} catch (error) {
				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Unable to sign in. Please check your credentials.";

				return { success: false, message };
			} finally {
				setAuthLoading(false);
			}
		},
		[persistSession]
	);

	// ================= GOOGLE LOGIN HANDLER =================
	// 5. Google OAuth login handler
	const googleLogin = useCallback(
		async (credential) => {
			setAuthLoading(true);
			try {
				const data = await googleLoginUser(credential);
				const { nextToken, nextUser } = extractSessionFromAuthPayload(data, {
					role: "patient",
				});

				if (!nextToken) {
					throw new Error("Google login succeeded but token was not returned.");
				}

				persistSession(nextToken, nextUser);
				return { success: true, data };
			} catch (error) {
				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Unable to sign in with Google.";

				return { success: false, message };
			} finally {
				setAuthLoading(false);
			}
		},
		[persistSession]
	);

	// ================= COMPLETE AUTH SESSION =================
	// 6. Complete session from OTP verification payload
	const completeAuthSession = useCallback(
		(authPayload, fallbackUser = {}) => {
			const { nextToken, nextUser } = extractSessionFromAuthPayload(authPayload, fallbackUser);

			if (!nextToken) {
				throw new Error("Authentication succeeded but token was not returned.");
			}

			persistSession(nextToken, nextUser);
			return nextUser;
		},
		[persistSession]
	);

	// ================= LOGOUT =================
	// 7. Logout handler
	const logout = useCallback(() => {
		clearSession();
	}, [clearSession]);

	// ================= UPDATE USER STATE =================
	// 8. Update local user profile state
	const updateUser = useCallback((updatedData) => {
		setUser(prev => {
			const nextUser = { ...prev, ...updatedData };
			safeSetItem(USER_KEY, JSON.stringify(nextUser));
			return nextUser;
		});
	}, []);

	// ================= REFRESH USER =================
	// 9. Fetch latest user details from server
	const refreshUser = useCallback(async () => {
		try {
			const { data } = await api.get("/api/users/me");
			updateUser(data);
		} catch (error) {
			console.error("Failed to refresh user data:", error);
		}
	}, [updateUser]);


	// 10. Memoize context values
	const contextValue = useMemo(
		() => ({
			token,
			user,
			isAuthenticated: Boolean(token),
			authLoading,
			login,
			googleLogin,
			completeAuthSession,
			logout,
			updateUser,
			refreshUser,
		}),
		[token, user, authLoading, login, googleLogin, completeAuthSession, logout, updateUser, refreshUser]
	);

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

