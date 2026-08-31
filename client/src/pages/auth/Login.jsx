// Login Page: email/password sign-in and Google OAuth authentication.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { FiCheckCircle, FiShield, FiActivity } from "react-icons/fi";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import useAuth from "../../hooks/useAuth";
import { validateLoginForm } from "../../utils/validators";
import styles from "./AuthPages.module.css";

const Login = () => {
	// Form state for email and password
	const [form, setForm] = useState({ email: "", password: "" });
	const [errors, setErrors] = useState({});
	const [alert, setAlert] = useState(null);
	const [clickCount, setClickCount] = useState(0);
	const [lastClickTime, setLastClickTime] = useState(0);
	const navigate = useNavigate();
	const { login, googleLogin, authLoading, isAuthenticated } = useAuth();

	// Redirect to dashboard if already authenticated
	useEffect(() => {
		if (isAuthenticated) navigate("/dashboard", { replace: true });
	}, [isAuthenticated, navigate]);

	// Handle input changes and clear field errors
	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
		setErrors(prev => ({ ...prev, [name]: "" }));
	};

	// ================= ADMIN SHORTCUT HANDLER =================
	// Easter egg: Triple-click logo to navigate to Admin login portal
	const handleBrandClick = () => {
		const now = Date.now();
		if (now - lastClickTime > 1000) {
			setClickCount(1);
		} else {
			const next = clickCount + 1;
			if (next >= 3) {
				navigate("/admin/portal/login");
				return;
			}
			setClickCount(next);
		}
		setLastClickTime(now);
	};

	// ================= SUBMIT LOGIN FORM =================
	// 1. Submit email and password login form
	const handleSubmit = async (e) => {
		e.preventDefault();
		const valErrors = validateLoginForm(form);
		setErrors(valErrors);
		if (Object.keys(valErrors).length > 0) return;

		setAlert(null);
		try {
			const res = await login(form);
			if (!res.success) {
				setAlert({ type: "error", message: res.message });
			}
		} catch (err) {
			setAlert({ type: "error", message: "A technical error occurred. Please try again." });
		}
	};

	// ================= GOOGLE OAUTH SUCCESS =================
	// 2. Handle Google OAuth login success
	const handleGoogleSuccess = async (credentialResponse) => {
		setAlert(null);
		try {
			const res = await googleLogin(credentialResponse.credential);
			if (!res.success) {
				setAlert({ type: "error", message: res.message });
			}
		} catch (err) {
			setAlert({ type: "error", message: "Google Login failed. Please try again." });
		}
	};


	return (
		<div className={styles.page}>
			{/* Left branding and features column */}
			<div className={styles.landingLeft}>
				<h1 className={styles.landingTitle}>The Future of Clinical Operations.</h1>
				<p className={styles.landingText}>
					Connect with elite practitioners, manage medical records, and orchestrate your healthcare journey from a single professional dashboard.
				</p>
				
				<div className={styles.featureList}>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiShield /></div>
						<span>Enterprise-Grade Data Security</span>
					</div>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiActivity /></div>
						<span>Real-time Clinical Insights</span>
					</div>
					<div className={styles.featureItem}>
						<div className={styles.featureIcon}><FiCheckCircle /></div>
						<span>Verified Medical Network</span>
					</div>
				</div>
			</div>

			{/* Right sign-in form card */}
			<div className={styles.landingRight}>
				<div className={styles.loginLayout} style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
					<div className={styles.brand} onClick={handleBrandClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
						<img src="/images/logo.png" alt="MediSync Logo" className={styles.logoImg} />
						<span>MediSync</span>
					</div>
					<h1 className={styles.heading}>Welcome Back</h1>
					<p className={styles.subHeading}>
						Please enter your details to sign in to your clinical account.
					</p>

					{alert && <div className={`${styles.alert} ${styles.errorAlert}`}>{alert.message}</div>}

					<form className={styles.form} onSubmit={handleSubmit} noValidate>
						<InputField 
							label="Email Address" 
							name="email" 
							value={form.email} 
							onChange={handleChange} 
							placeholder="Enter your Email Address" 
							error={errors.email} 
							required 
						/>
						
						<div style={{ position: "relative" }}>
							<Link to="/forgot-password" style={{ position: "absolute", right: 0, top: 0, fontSize: "0.8rem", color: "#10b981", fontWeight: 700, textDecoration: 'none' }}>Forgot Password?</Link>
							<InputField 
								label="Password" 
								name="password" 
								type="password" 
								value={form.password} 
								onChange={handleChange} 
								placeholder="Enter your Password" 
								error={errors.password} 
								required 
							/>
						</div>

						<div className={styles.formFooter} style={{marginTop: '10px'}}>
							<Button type="submit" variant="success" loading={authLoading}>
								SIGN IN
							</Button>
						</div>
					</form>

					<div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: '#64748b' }}>
						New to MediSync? <Link to="/register" style={{ color: "#10b981", fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
					</div>
					
					<div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
						<div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
						<div style={{ margin: '0 10px', color: '#94a3b8', fontSize: '0.85rem' }}>OR</div>
						<div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
					</div>

					{/* Google Single Sign-On Button */}
					<div style={{ display: 'flex', justifyContent: 'center' }}>
						<GoogleLogin
							onSuccess={handleGoogleSuccess}
							onError={() => {
								setAlert({ type: "error", message: "Google Login Failed" });
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;

