// OTP Verification Page: handles 6-digit verification code input, auto-submission, and account activation.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import useAuth from "../../hooks/useAuth";
import { sendOtp, verifyOtp } from "../../services/authService";
import { validateOtp } from "../../utils/validators";
import OtpInput from "../../components/OtpInput";
import styles from "./AuthPages.module.css";

const OTP_LENGTH = 6;
const PENDING_REG_EMAIL_KEY = "medisync_pending_registration_email";

const OtpVerification = () => {
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const location = useLocation();
  const navigate = useNavigate();
  const { completeAuthSession } = useAuth();
  const inputRefs = useRef([]);
  const email = location.state?.email || localStorage.getItem(PENDING_REG_EMAIL_KEY) || "";
  const otp = otpDigits.join("");

  // Countdown timer for OTP resend button
  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  // Handle single character input and advance focus to next box
  const handleOtpInputChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleaned.slice(-1);
    setOtpDigits(nextDigits);
    setError("");

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Keyboard navigation between OTP boxes (backspace, arrows)
  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Paste 6-digit OTP code handler
  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const nextDigits = Array(OTP_LENGTH)
      .fill("")
      .map((_, index) => pasted[index] || "");

    setOtpDigits(nextDigits);
    setError("");

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  // Auto-trigger verification once all 6 digits are typed
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !loading) {
      handleVerify();
    }
  }, [otp, loading]);

  // ================= VERIFY OTP =================
  // 1. Submit OTP verification request to activate account & start session
  const handleVerify = async (event) => {
    if (event) event.preventDefault();
    const otpError = validateOtp(otp);

    if (otpError) {
      setError(otpError);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const authData = await verifyOtp({ otp, email, purpose: "registration" });
      const authenticatedUser = completeAuthSession(authData, { email, role: "patient" });
      localStorage.removeItem(PENDING_REG_EMAIL_KEY);

      setAlert({
        type: "success",
        message: "OTP verified successfully. Completing your onboarding...",
      });

      // Route new patients to health survey, doctors to doctor dashboard
      const nextPath = authenticatedUser?.role === "patient" ? "/onboarding-survey" : "/dashboard";
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setAlert({
        type: "error",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "OTP verification failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND OTP =================
  // 2. Resend new OTP code
  const handleResendOtp = async () => {
    if (resendCountdown > 0) {
      return;
    }

    if (!email) {
      setAlert({
        type: "error",
        message: "Email is missing. Please register again to request OTP.",
      });
      return;
    }

    setLoading(true);

    try {
      await sendOtp({ email, purpose: "registration" });

      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendCountdown(30);

      setAlert({
        type: "success",
        message: "A new OTP has been sent to your email.",
      });
    } catch (requestError) {
      setAlert({
        type: "error",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to resend OTP. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.page}>
      <div className={styles.landingLeft}>
        <h1 className={styles.landingTitle}>Secure Your Access.</h1>
        <p className={styles.landingText}>
          We use multi-factor authentication to ensure your clinical data remains strictly confidential and secure.
        </p>
      </div>
      <div className={styles.landingRight}>
        <div className={styles.otpCard} style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
        <div className={styles.brand}>MediSync</div>
        <h2 className={styles.heading}>Security Code</h2>
        <p className={styles.subHeading}>
          Sent to {email ? <strong style={{ color: 'var(--text-main)' }}>{email}</strong> : "your email"}.
        </p>

        {alert ? (
          <div
            className={`${styles.alert} ${
              alert.type === "success" ? styles.successAlert : styles.errorAlert
            }`}
            role="alert"
          >
            {alert.message}
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleVerify} noValidate>
          <OtpInput 
            value={otp} 
            onChange={(val) => setOtpDigits(val.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH))}
            error={error}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <Button type="submit" loading={loading} style={{ width: '220px' }}>
              {loading ? 'Verifying...' : 'Continue'}
            </Button>

            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
            >
              {resendCountdown > 0 ? `Resend available in ${resendCountdown}s` : "Resend Code"}
            </button>
          </div>
        </form>

        <p className={styles.footerText} style={{ marginTop: '32px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Need to change email? <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'none' }}>Go to Register</Link>
        </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;