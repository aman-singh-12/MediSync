import api from "./api";

export const getMyMedicalRecords = async (params) => {
	const response = await api.get("/api/medicalRecords/my", { params });
	return response.data;
};

export const uploadMedicalRecord = async (formData) => {
	const response = await api.post("/api/medicalRecords/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response.data;
};
