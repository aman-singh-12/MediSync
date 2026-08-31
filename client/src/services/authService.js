// Authentication API Services: client-side API requests for auth and OTP verification.
import api from "./api";

// ================= LOGIN USER =================
// 1. Authenticate user with email and password
export const loginUser = async (payload) => {
  const response = await api.post("/api/auth/login", payload);
  return response.data;
};

// ================= REGISTER USER =================
// 2. Submit initial user registration details
export const registerUser = async (payload) => {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
};

// ================= SEND OTP =================
// 3. Request OTP code generation and email dispatch
export const sendOtp = async (payload) => {
  const response = await api.post("/api/auth/send-otp", payload);
  return response.data;
};

// ================= VERIFY OTP =================
// 4. Submit 6-digit OTP code to verify and activate account
export const verifyOtp = async (payload) => {
  const response = await api.post("/api/auth/verify-otp", payload);
  return response.data;
};

// ================= RESET PASSWORD =================
// 5. Update user password after successful OTP verification
export const resetPassword = async (payload) => {
  const response = await api.post("/api/auth/reset-password", payload);
  return response.data;
};

// ================= GOOGLE LOGIN =================
// 6. Authenticate via Google OAuth credential token
export const googleLoginUser = async (credential) => {
  const response = await api.post("/api/auth/google", { credential });
  return response.data;
};
