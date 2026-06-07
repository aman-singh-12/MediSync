import api from "./api";

export const loginUser = async (payload) => {
  const response = await api.post("/api/auth/login", payload);
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await api.post("/api/auth/register", payload);
  return response.data;
};

export const sendOtp = async (payload) => {
  const response = await api.post("/api/auth/send-otp", payload);
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await api.post("/api/auth/verify-otp", payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post("/api/auth/reset-password", payload);
  return response.data;
};