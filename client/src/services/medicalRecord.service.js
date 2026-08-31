// Medical Record API Services: client-side HTTP calls for patient medical records and file uploads.
import api from "./api";

// ================= GET MY MEDICAL RECORDS =================
// 1. Fetch authenticated patient's medical records
export const getMyMedicalRecords = async (params) => {
	const response = await api.get("/api/medicalRecords/my", { params });
	return response.data;
};

// ================= UPLOAD MEDICAL RECORD =================
// 2. Upload medical record document/image (multipart/form-data)
export const uploadMedicalRecord = async (formData) => {
	const response = await api.post("/api/medicalRecords/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response.data;
};


