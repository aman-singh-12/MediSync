import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiCheckCircle, FiArrowLeft, FiShield, FiKey } from "react-icons/fi";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { resetPassword, sendOtp, verifyOtp } from "../../services/authService";
import { validateForgotEmail, validateOtp, validatePasswordReset } from "../../utils/validators";
import OtpInput from "../../components/OtpInput";
import styles from "./AuthPages.module.css";

const OTP_LENGTH = 6;

const ForgotPassword = () => {
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState("");
	const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(""));
	const [resetForm, setResetForm] = useState({
		newPassword: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [alert, setAlert] = useState(null);
	const [loading, setLoading] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(30);
	const navigate = useNavigate();

	const otp = otpDigits.join("");

	useEffect(() => {
		if (step !== 2 || resendCountdown <= 0) {
			return undefined;
		}

		const timer = window.setInterval(() => {
			setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [step, resendCountdown]);

	const handleIdentifyUser = async (e) => {
		e.preventDefault();
		const emailError = validateForgotEmail(email);

		if (emailError) {
			setErrors({ email: emailError });
			return;
		}

		setLoading(true);
		setErrors({});
		setAlert(null);

		try {
			await sendOtp({ email: email.trim(), purpose: "reset-password" });
			setOtpDigits(Array(OTP_LENGTH).fill(""));
			setResendCountdown(30);
			setStep(2);
			setAlert({
				type: "success",
				message: "User found. OTP sent to your email.",
			});
		} catch (error) {
			setAlert({
				type: "error",
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Unable to find user. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (e) => {
		e.preventDefault();
		const otpError = validateOtp(otp);

		if (otpError) {
			setErrors({ otp: otpError });
			return;
		}

		setLoading(true);
		setErrors({});
		setAlert(null);

		try {
			await verifyOtp({ email: email.trim(), otp, purpose: "reset-password" });
			setStep(3);
			setAlert({
				type: "success",
				message: "OTP verified. Please set your new password.",
			});
		} catch (error) {
			setAlert({
				type: "error",
				message:
					error?.response?.data?.message ||
					error?.message ||
					"OTP verification failed. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (resendCountdown > 0) {
			return;
		}

		setLoading(true);
		setAlert(null);

		try {
			await sendOtp({ email: email.trim(), purpose: "reset-password" });
			setOtpDigits(Array(OTP_LENGTH).fill(""));
			setResendCountdown(30);
			setAlert({
				type: "success",
				message: "A new OTP has been sent.",
			});
		} catch (error) {
			setAlert({
				type: "error",
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to resend OTP.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		const nextErrors = validatePasswordReset(resetForm);

		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			return;
		}

		setLoading(true);
		setErrors({});
		setAlert(null);

		try {
			await resetPassword({
				email: email.trim(),
				newPassword: resetForm.newPassword,
				confirmPassword: resetForm.confirmPassword,
			});

			setAlert({
				type: "success",
				message: "Password changed successfully. Redirecting to login...",
			});

			window.setTimeout(() => {
				navigate("/login", { replace: true });
			}, 1500);
		} catch (error) {
			setAlert({
				type: "error",
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to reset password.",
			});
		} finally {
			setLoading(false);
		}
	};

	const stepMeta = [
		{ num: 1, label: "Identify", icon: <FiMail /> },
		{ num: 2, label: "Verify", icon: <FiShield /> },
		{ num: 3, label: "Reset", icon: <FiLock /> },
	];

	const renderIcon = () => {
		if (step === 1) return <FiMail />;
		if (step === 2) return <FiShield />;
		return <FiKey />;
	};

	return (
		<div className={styles.forgotPage}>
			<div className={styles.forgotCard}>
				<div className={styles.forgotHeader}>
					<div className={styles.iconBadge}>
						{renderIcon()}
					</div>
					<h2 className={styles.forgotTitle}>
						{step === 1 ? "Forgot Password?" : step === 2 ? "Verify Identity" : "Reset Password"}
					</h2>
					<p className={styles.forgotDesc}>
						{step === 1 
							? "Enter your email address and we'll send you a recovery code." 
							: step === 2 
							? "We've sent a 6-digit verification code to your registered email."
							: "Create a strong password that you don't use elsewhere."
						}
					</p>
				</div>

				<div className={styles.stepper}>
					{stepMeta.map((item, i) => (
						<div 
							key={i} 
							className={`${styles.step} ${step === item.num ? styles.stepActive : ""} ${step > item.num ? styles.stepCompleted : ""}`}
						>
							<div className={styles.stepCircle}>
								{step > item.num ? <FiCheckCircle /> : item.num}
							</div>
							<span className={styles.stepLabelText}>{item.label}</span>
						</div>
					))}
				</div>

				{alert && (
					<div className={`${styles.alert} ${alert.type === "success" ? styles.successAlert : styles.errorAlert}`}>
						{alert.message}
					</div>
				)}

				{step === 1 && (
					<form className={styles.form} onSubmit={handleIdentifyUser} noValidate>
						<InputField
							label="EMAIL ADDRESS"
							name="forgotEmail"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your registered email"
							error={errors.email}
							required
						/>

						<Button type="submit" loading={loading} style={{ height: '52px', fontSize: '1rem' }}>
							Send Recovery Code
						</Button>
					</form>
				)}

				{step === 2 && (
					<div className={styles.form}>
						<div className={styles.otpInstruction}>
							Security code sent to:
							<span className={styles.otpEmail}>{email}</span>
						</div>

						<form onSubmit={handleVerifyOtp}>
							<OtpInput 
								value={otp} 
								onChange={(val) => setOtpDigits(val.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH))}
								error={errors.otp}
							/>

							<Button type="submit" loading={loading} style={{ width: '100%', marginTop: '24px', height: '52px' }}>
								Verify & Continue
							</Button>
						</form>

						<div className={styles.forgotFooter} style={{ border: 'none', marginTop: '12px' }}>
							<p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
								Didn't receive the code?
							</p>
							<button 
								type="button" 
								onClick={handleResendOtp} 
								disabled={loading || resendCountdown > 0} 
								className={styles.resendBtn}
							>
								{resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend Security Code"}
							</button>
						</div>
					</div>
				)}

				{step === 3 && (
					<form className={styles.form} onSubmit={handleResetPassword} noValidate>
						<InputField
							label="NEW PASSWORD"
							name="newPassword"
							type="password"
							value={resetForm.newPassword}
							onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
							placeholder="Minimum 8 characters"
							error={errors.newPassword}
							required
						/>

						<InputField
							label="CONFIRM PASSWORD"
							name="confirmPassword"
							type="password"
							value={resetForm.confirmPassword}
							onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
							placeholder="Repeat new password"
							error={errors.confirmPassword}
							required
						/>

						<Button type="submit" loading={loading} style={{ height: '52px', fontSize: '1rem' }}>
							Set New Password
						</Button>
					</form>
				)}

				<div className={styles.forgotFooter}>
					<Link to="/login" className={styles.backLink}>
						<FiArrowLeft /> Back to Sign In
					</Link>
				</div>
			</div>

			<div style={{ position: 'absolute', bottom: '24px', textAlign: 'center', opacity: 0.5, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>
				SECURED BY MEDISYNC CLINICAL SYSTEMS
			</div>
		</div>
	);
};

export default ForgotPassword;
