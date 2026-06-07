import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUserCheck, FiLayout, FiClock } from "react-icons/fi";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { registerUser } from "../../services/authService";
import { validateRegisterForm } from "../../utils/validators";
import styles from "./AuthPages.module.css";

const initialForm = {
	fullName: "",
	email: "",
	phone: "",
	password: "",
	confirmPassword: "",
	age: "",
	gender: "",
	specialization: "",
	experience: "",
	consultationFee: "",
};

const Register = () => {
	const [role, setRole] = useState("patient");
	const [step, setStep] = useState(1);
	const [form, setForm] = useState(initialForm);
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState(null);
	const [agreed, setAgreed] = useState(false);
	const navigate = useNavigate();

	const handleChange = (e) => {
		let { name, value } = e.target;
		if (name === "phone") {
			value = value.replace(/\D/g, '').slice(0, 10);
		}
		setForm(prev => ({ ...prev, [name]: value }));
		setErrors(prev => ({ ...prev, [name]: "" }));
	};

	const validateStep = (s) => {
		const errs = {};
		if (s === 1) {
			if (!form.fullName) errs.fullName = "Required";
			if (!form.email) errs.email = "Required";
			if (!form.phone || form.phone.length !== 10) errs.phone = "Invalid phone";
			if (role === "patient") {
				if (!form.age) errs.age = "Required";
				if (!form.gender) errs.gender = "Required";
			} else {
				if (!form.specialization) errs.specialization = "Required";
				if (!form.experience) errs.experience = "Required";
				if (!form.consultationFee) errs.consultationFee = "Required";
			}
		}
		return errs;
	};

	const handleNext = () => {
		const stepErrors = validateStep(step);
		setErrors(stepErrors);
		if (Object.keys(stepErrors).length === 0) setStep(2);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const validationErrors = validateRegisterForm(form, role);
		if (!agreed) validationErrors.agree = "Required";
		
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		setLoading(true);
		setAlert(null);
		try {
			await registerUser({ ...form, role });
			navigate("/verify-otp", { state: { email: form.email } });
		} catch (err) {
			setAlert({ type: "error", message: err?.response?.data?.message || "Registration failed." });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.page}>
			<div className={styles.landingLeft} style={{ backgroundImage: "linear-gradient(rgba(6, 78, 59, 0.75), rgba(6, 78, 59, 0.75)), url('/images/register_green.png')" }}>
				<h1 className={styles.landingTitle}>Join the Future of Clinical Care.</h1>
				<p className={styles.landingText}>
					Join elite practitioners and patients orchestrating their healthcare journey through MediSync's high-performance clinical platform.
				</p>
				
				<div className={styles.featureList}>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiUserCheck /></div>
						<span>Enterprise-Grade Data Security</span>
					</div>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiLayout /></div>
						<span>Real-time Clinical Insights</span>
					</div>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiClock /></div>
						<span>Verified Medical Network</span>
					</div>
				</div>
			</div>

			<div className={styles.landingRight}>
				<div className={styles.registerLayout} style={{ border: 'none', boxShadow: 'none', padding: 0, maxWidth: '440px' }}>
					<div className={styles.brand} style={{ marginBottom: '40px' }}>
						<img src="/images/logo.png" alt="MediSync Logo" className={styles.logoImg} />
						<span>MediSync</span>
					</div>
					
					<h1 className={styles.heading}>Create Account</h1>
					<p className={styles.subHeading} style={{ marginBottom: '32px' }}>
						Please fill in your credentials below to create your account.
					</p>

					<div className={styles.roleSelector}>
						{["Patient", "Doctor"].map(r => (
							<button 
								key={r} 
								type="button" 
								style={{ 
									flex: 1, 
									padding: '8px 16px', 
									borderRadius: '40px', 
									border: 'none', 
									background: role === r.toLowerCase() ? 'white' : 'transparent',
									color: role === r.toLowerCase() ? '#10b981' : '#64748b',
									fontWeight: 600,
									fontSize: '0.9rem',
									cursor: 'pointer',
									boxShadow: role === r.toLowerCase() ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
								}} 
								onClick={() => {
									setRole(r.toLowerCase());
									setErrors({});
								}}
							>
								{r}
							</button>
						))}
					</div>

					{alert && <div className={`${styles.alert} ${styles.errorAlert}`} style={{ marginBottom: '24px' }}>{alert.message}</div>}

					<form className={styles.form} onSubmit={handleSubmit} noValidate>
						<div className={styles.fieldGrid}>
							<div style={{gridColumn: '1/-1'}}><InputField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g. Julian Pierce" error={errors.fullName} required /></div>
							<InputField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="julian@clinic.com" error={errors.email} required />
							<InputField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="10-digit number" error={errors.phone} required />
							
							{role === "patient" ? (
								<>
									<InputField label="Age" name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 25" error={errors.age} required />
									<div className={styles.field}>
										<label style={{fontSize: '0.725rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.075em', marginBottom: '2px', display: 'block'}}>Gender</label>
										<select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: '0.95rem' }}>
											<option value="">Select</option>
											<option value="male">Male</option>
											<option value="female">Female</option>
											<option value="other">Other</option>
										</select>
										{errors.gender && <p style={{color: '#ef4444', fontSize: '0.8rem', marginTop: '4px'}}>{errors.gender}</p>}
									</div>
								</>
							) : (
								<>
									<InputField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Cardiology" error={errors.specialization} required />
									<InputField label="Experience (Years)" name="experience" type="number" value={form.experience} onChange={handleChange} placeholder="e.g. 10" error={errors.experience} required />
									<div style={{gridColumn: '1/-1'}}>
										<InputField label="Consultation Fee (₹)" name="consultationFee" type="number" value={form.consultationFee} onChange={handleChange} placeholder="e.g. 500" error={errors.consultationFee} required />
									</div>
								</>
							)}

							<InputField label="Create Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••••••" error={errors.password} required />
							<InputField label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••••••" error={errors.confirmPassword} required />
						</div>

						<label className={styles.checkboxRow} style={{ marginTop: '12px' }}>
							<input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: '#10b981' }} />
							<span>I accept the Terms and Privacy Policy.</span>
						</label>
						{errors.agree && <p className={styles.errorText}>{errors.agree}</p>}

						<div className={styles.formFooter}>
							<Button type="submit" variant="success" loading={loading}>
								REGISTER NOW
							</Button>
							<p style={{textAlign: 'center', color: '#64748b', marginTop: '24px', fontSize: '0.9rem'}}>
								Already have an account? <Link to="/login" style={{color: '#10b981', fontWeight: 700, textDecoration: 'none'}}>Sign In</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Register;
