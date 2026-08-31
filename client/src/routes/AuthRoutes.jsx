// Router Configuration: defines public, auth, and role-protected dashboard routes.
import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import useAuth from "../hooks/useAuth";
import DashboardLayout from "../components/DashboardLayout";

// Import Public & Auth Pages
import Home from "../pages/Home";
import OnboardingSurvey from "../pages/auth/OnboardingSurvey";
import Payments from "../pages/Payments";
import Settings from "../pages/Settings";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import OtpVerification from "../pages/auth/OtpVerification";

// Import Patient Pages
import Appointments from "../pages/patient/Appointments";
import PatientDashboard from "../pages/patient/Dashboard";
import MedicalRecords from "../pages/patient/MedicalRecords";
import DoctorSearch from "../pages/patient/DoctorSearch";
import Favorites from "../pages/patient/Favorites";
import MedicalKnowledge from "../pages/patient/MedicalKnowledge";

// Import Admin Pages
import ManageUsers from "../pages/admin/ManageUsers";
import VerifyDoctors from "../pages/admin/VerifyDoctors";
import AdminRegister from "../pages/admin/AdminRegister";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminAppointments from "../pages/admin/AdminAppointments";
import RubricConceptsLab from "../pages/admin/RubricConceptsLab";

// Import Doctor Pages
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorMyProfile from "../pages/doctor/Profile";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import Reviews from "../pages/doctor/Reviews";
import Availability from "../pages/doctor/Availability";
import Patients from "../pages/doctor/Patients";
import Notifications from "../pages/doctor/Notifications";

// 1. Layout Wrapper: wraps all dashboard pages in DashboardLayout sidebar navigation
const DashboardWrapper = () => {
  const { pathname } = useLocation();
  return (
    <DashboardLayout activePath={pathname}>
      <Outlet />
    </DashboardLayout>
  );
};

// 2. Role Switcher: dynamically displays dashboard based on user role (patient / doctor / admin)
const RoleDashboard = () => {
  const { user } = useAuth();
  const role = user?.role || "patient";
  if (role === "doctor") return <DoctorDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <PatientDashboard />;
};

// 3. Application Route Tree Definition
const AuthRoutes = () => {
	const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
			<Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/portal/register" element={<AdminRegister />} />
      <Route path="/admin/portal/login" element={<AdminLogin />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes: requires valid JWT session */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardWrapper />}>
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payments" element={<Payments />} />
          
          {/* Patient Specific Routes */}
          <Route path="/find-doctors" element={<DoctorSearch />} />
          <Route path="/appointment-history" element={<Appointments />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/book-appointment" element={<Appointments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/medical-knowledge" element={<MedicalKnowledge />} />

          {/* Doctor Specific Routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/my-profile" element={<DoctorMyProfile />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/reviews" element={<Reviews />} />
          <Route path="/doctor/availability" element={<Availability />} />
          <Route path="/doctor/patients" element={<Patients />} />
          <Route path="/doctor/notifications" element={<Notifications />} />

          {/* Admin Specific Routes */}
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/doctors" element={<VerifyDoctors />} />
          <Route path="/admin/rubric-lab" element={<RubricConceptsLab />} />
          <Route path="/rubric-lab" element={<RubricConceptsLab />} />
        </Route>

        <Route path="/onboarding-survey" element={<OnboardingSurvey />} />
      </Route>

      {/* Fallback Catch-all Route */}
			<Route
				path="*"
				element={<Navigate to={isAuthenticated ? "/dashboard" : "/register"} replace />}
			/>
    </Routes>
  );
};

export default AuthRoutes;