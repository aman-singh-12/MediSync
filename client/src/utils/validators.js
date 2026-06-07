const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(String(email).trim());

const hasText = (value) => String(value || "").trim().length > 0;

export const validateLoginForm = (form) => {
	const errors = {};

	if (!hasText(form.email)) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(form.email)) {
		errors.email = "Enter a valid email address.";
	}

	if (!hasText(form.password)) {
		errors.password = "Password is required.";
	}

	return errors;
};

export const validateRegisterForm = (form, role) => {
	const errors = {};

	if (!hasText(form.fullName)) {
		errors.fullName = "Full name is required.";
	}

	if (!hasText(form.email)) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(form.email)) {
		errors.email = "Enter a valid email address.";
	}

	if (!hasText(form.password)) {
		errors.password = "Password is required.";
	} else if (String(form.password).length < 8) {
		errors.password = "Password must be at least 8 characters.";
	}

	if (!hasText(form.confirmPassword)) {
		errors.confirmPassword = "Please confirm your password.";
	} else if (form.password !== form.confirmPassword) {
		errors.confirmPassword = "Passwords do not match.";
	}

	if (role === "patient") {
		if (!hasText(form.age)) {
			errors.age = "Age is required.";
		} else if (Number(form.age) < 0 || Number(form.age) > 120) {
			errors.age = "Enter a valid age.";
		}

		if (!hasText(form.gender)) {
			errors.gender = "Gender is required.";
		}
	}

	if (role === "doctor") {
		if (!hasText(form.specialization)) {
			errors.specialization = "Specialization is required.";
		}

		if (!hasText(form.experience)) {
			errors.experience = "Experience is required.";
		} else if (Number(form.experience) < 0) {
			errors.experience = "Experience cannot be negative.";
		}

		if (!hasText(form.consultationFee)) {
			errors.consultationFee = "Consultation fee is required.";
		} else if (Number(form.consultationFee) <= 0) {
			errors.consultationFee = "Consultation fee must be greater than 0.";
		}
	}

	return errors;
};

export const validateOtp = (otpValue) => {
	if (!hasText(otpValue)) {
		return "OTP is required.";
	}

	if (!/^\d{6}$/.test(String(otpValue))) {
		return "OTP must be a 6-digit number.";
	}

	return "";
};

export const validateForgotEmail = (email) => {
	if (!hasText(email)) {
		return "Email is required.";
	}

	if (!isValidEmail(email)) {
		return "Enter a valid email address.";
	}

	return "";
};

export const validatePasswordReset = (form) => {
	const errors = {};

	if (!hasText(form.newPassword)) {
		errors.newPassword = "New password is required.";
	} else if (String(form.newPassword).length < 8) {
		errors.newPassword = "Password must be at least 8 characters.";
	}

	if (!hasText(form.confirmPassword)) {
		errors.confirmPassword = "Please confirm your new password.";
	} else if (form.newPassword !== form.confirmPassword) {
		errors.confirmPassword = "Passwords do not match.";
	}

	return errors;
};

export const getPasswordStrength = (passwordValue) => {
	const password = String(passwordValue || "");

	if (!password) {
		return {
			label: "",
			tone: "none",
			percent: 0,
		};
	}

	let score = 0;

	if (password.length >= 8) {
		score += 1;
	}

	if (/[A-Z]/.test(password)) {
		score += 1;
	}

	if (/[a-z]/.test(password)) {
		score += 1;
	}

	if (/\d/.test(password)) {
		score += 1;
	}

	if (/[^A-Za-z0-9]/.test(password)) {
		score += 1;
	}

	if (score <= 2) {
		return {
			label: "Weak",
			tone: "weak",
			percent: 35,
		};
	}

	if (score <= 4) {
		return {
			label: "Medium",
			tone: "medium",
			percent: 68,
		};
	}

	return {
		label: "Strong",
		tone: "strong",
		percent: 100,
	};
};
