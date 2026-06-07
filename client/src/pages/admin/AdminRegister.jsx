import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { registerUser } from "../../services/authService";
import styles from "../auth/AuthPages.module.css";

const visibleRegisterFields = ["fullName", "email", "password", "confirmPassword"];
const PENDING_REG_EMAIL_KEY = "medisync_pending_registration_email";

const initialForm = {
	fullName: "",
	email: "",
	phone: "",
	password: "",
	confirmPassword: "",
};

const AdminRegister = () => {
	const role = "admin"; // Hardcoded
	const [form, setForm] = useState(initialForm);
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState(null);
	const [agreed, setAgreed] = useState(false);
	const navigate = useNavigate();

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({
			...prev,
			[name]: value,
		}));
		setErrors((prev) => ({
			...prev,
			[name]: "",
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		
		const validationErrors = {};
		if (!form.fullName) validationErrors.fullName = "Name is required";
		if (!form.email) validationErrors.email = "Email is required";
		if (!form.password) validationErrors.password = "Password is required";
		if (form.password !== form.confirmPassword) validationErrors.confirmPassword = "Passwords do not match";
		if (!agreed) validationErrors.agree = "Required";

		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		setLoading(true);
		try {
			await registerUser({ role, fullName: form.fullName, email: form.email, password: form.password });
			localStorage.setItem(PENDING_REG_EMAIL_KEY, form.email);
			navigate("/verify-otp", { state: { email: form.email } });
		} catch (error) {
			setAlert({ type: "error", message: error?.response?.data?.message || "Failed" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.page} style={{ backgroundColor: "#1a1a1a" }}>
			<div className={styles.registerLayout}>
				<div className={styles.registerHeader}>
					<div className={styles.brand} style={{ color: "white" }}>
						<span className={styles.brandIcon} style={{ background: "#dc3545" }}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z" />
							</svg>
						</span>
						Admin Central
					</div>
				</div>

				<div className={styles.registerContentGrid}>
					<div style={{ display: "flex", flexDirection: "column", background: "white", padding: "40px", borderRadius: "24px" }}>
						<h1 style={{ fontSize: "2rem", color: "#dc3545" }}>Admin Registration</h1>
						<p style={{ color: "#666", marginBottom: "24px" }}>Secure portal for system administrators only.</p>

						{alert && <div className={styles.alert}>{alert.message}</div>}

						<form className={styles.form} onSubmit={handleSubmit}>
							<InputField label="FULL NAME" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} required />
							<InputField label="ADMIN EMAIL" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required />
							<InputField label="PASSWORD" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} required />
							<InputField label="CONFIRM" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
							
							<label className={styles.checkboxRow}>
								<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
								<span>I confirm I am an authorized administrator.</span>
							</label>

							<Button type="submit" loading={loading} style={{ background: "#dc3545" }}>
								Register Admin Account
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminRegister;
