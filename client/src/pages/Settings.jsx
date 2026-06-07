import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useToast } from "../components/ToastContext";
import Button from "../components/Button";
import InputField from "../components/InputField";
import api from "../services/api";
import OtpInput from "../components/OtpInput";
import styles from "./Settings.module.css";
import { getImageUrl } from "../utils/imageUrl";

const Settings = () => {
	const [activeTab, setActiveTab] = useState("Profile");
	const { user, updateUser } = useAuth();
	const { addToast } = useToast();
	const [form, setForm] = useState({
		fullName: "",
		email: "",
		phone: "",
		dateOfBirth: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: ""
	});
	const [loading, setLoading] = useState(false);
	const [showOtp, setShowOtp] = useState(false);
	const [otp, setOtp] = useState("");
	const [otpContext, setOtpContext] = useState("");

	useEffect(() => {
		if (user) {
			setForm(prev => ({
				...prev,
				fullName: user.name || user.fullName || "",
				email: user.email || "",
				phone: user.phone || "",
				dateOfBirth: user.dateOfBirth || ""
			}));
		}
	}, [user]);

	const handleChange = (e) => {
		let { name, value } = e.target;
		if (name === "phone") {
			value = value.replace(/\D/g, '').slice(0, 10);
		}
		setForm({ ...form, [name]: value });
	};

	const handleRequestUpdate = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await api.post("/api/auth/send-otp", { email: form.email, purpose: "update-profile" });
			setOtpContext("profile");
			setShowOtp(true);
			addToast("Verification code sent to your email.", "success");
		} catch (err) {
			addToast(err.response?.data?.message || "Failed to initiate update.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyAndSave = async () => {
		setLoading(true);
		try {
			if (otpContext === "profile") {
				await api.put("/api/auth/profile", { ...form, otp });
				updateUser({ name: form.fullName, phone: form.phone });
				addToast("Profile updated successfully.", "success");
			} else if (otpContext === "password") {
				await api.put("/api/auth/update-password", {
					currentPassword: form.currentPassword,
					newPassword: form.newPassword,
					otp
				});
				addToast("Password updated successfully.", "success");
				setForm({ ...form, currentPassword: "", newPassword: "", confirmPassword: "" });
			}
			setShowOtp(false);
		} catch (err) {
			addToast(err.response?.data?.message || "Verification failed.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("profilePicture", file);
		
		try {
			setLoading(true);
			const res = await api.post("/api/users/upload-profile-picture", formData, {
				headers: { "Content-Type": "multipart/form-data" }
			});
			updateUser({ profilePicture: res.data.profilePicture });
			addToast("Profile picture updated successfully.", "success");
		} catch (err) {
			addToast(err.response?.data?.message || "Failed to upload image.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();
		if (form.newPassword !== form.confirmPassword) {
			addToast("Passwords do not match.", "error");
			return;
		}
		setLoading(true);
		try {
			await api.post("/api/auth/send-otp", { email: form.email, purpose: "update-profile" });
			setOtpContext("password");
			setShowOtp(true);
			addToast("Verification code sent to your email.", "success");
		} catch (err) {
			addToast(err.response?.data?.message || "Failed to update password.", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
			<div className={styles.container}>
				<header className={styles.header}>
					<h1 className={styles.title}>Account Settings</h1>
					<div className={styles.tabs}>
						{["Profile", "Security"].map(tab => (
							<button 
								key={tab} 
								className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
								onClick={() => setActiveTab(tab)}
							>
								{tab}
							</button>
						))}
					</div>
				</header>

				<div className={styles.card}>
					{activeTab === "Profile" ? (
						<form onSubmit={handleRequestUpdate} className={styles.form}>
							<div className={styles.profileSection}>
								<div className={styles.avatarLarge} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('dp-upload').click()}>
									{user?.profilePicture ? (
										<img src={getImageUrl(user.profilePicture)} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
									) : (
										<img src={`https://ui-avatars.com/api/?name=${(user?.name || "User").replace(' ', '+')}&background=random`} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
									)}
									<div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
									</div>
									<input id="dp-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
								</div>
								<div>
									<h2 className={styles.sectionTitle}>Personal Identity</h2>
									<p className={styles.sectionDesc}>Manage your profile details and clinical identifiers.</p>
								</div>
							</div>

							<div className={styles.formGrid}>
								<InputField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" />
								<InputField label="Email Address (Immutable)" name="email" value={form.email} readOnly disabled />
								<InputField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone Number" maxLength={10} />
								<InputField label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" />
							</div>

							{showOtp && otpContext === "profile" && (
								<div className={styles.otpSection}>
									<div style={{ marginBottom: '16px' }}>
										<p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>VERIFICATION CODE</p>
										<OtpInput value={otp} onChange={setOtp} />
									</div>
									<Button onClick={handleVerifyAndSave} loading={loading} style={{width: '100%'}}>Verify & Save Changes</Button>
								</div>
							)}

							{(!showOtp || otpContext !== "profile") && (
								<div className={styles.formFooter}>
									<Button type="submit" loading={loading}>Update Profile Details</Button>
								</div>
							)}
						</form>
					) : (
						<form onSubmit={handlePasswordUpdate} className={styles.form}>
							<h2 className={styles.sectionTitle}>Security Credentials</h2>
							<p className={styles.sectionDesc}>Update your password to keep your medical data secure.</p>
							
							<div className={styles.formGrid}>
								<InputField label="Current Password" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} required />
								<div style={{gridColumn: '1/-1'}}>
									<InputField label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} required />
								</div>
								<div style={{gridColumn: '1/-1'}}>
									<InputField label="Confirm New Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
								</div>
							</div>

							{showOtp && otpContext === "password" && (
								<div className={styles.otpSection}>
									<div style={{ marginBottom: '16px' }}>
										<p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>VERIFICATION CODE</p>
										<OtpInput value={otp} onChange={setOtp} />
									</div>
									<Button onClick={handleVerifyAndSave} loading={loading} style={{width: '100%'}}>Verify & Change Password</Button>
								</div>
							)}

							{(!showOtp || otpContext !== "password") && (
								<div className={styles.formFooter}>
									<Button type="submit" loading={loading}>Change Password</Button>
								</div>
							)}
						</form>
					)}
				</div>
			</div>
	);
};

export default Settings;
