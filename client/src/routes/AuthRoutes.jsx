import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import useAuth from "../hooks/useAuth";
import DashboardLayout from "../components/DashboardLayout";

import Home from "../pages/Home";
import OnboardingSurvey from "../pages/auth/OnboardingSurvey";
import Payments from "../pages/Payments";
import Settings from "../pages/Settings";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import OtpVerification from "../pages/auth/OtpVerification";

import Appointments from "../pages/patient/Appointments";
import PatientDashboard from "../pages/patient/Dashboard";
import MedicalRecords from "../pages/patient/MedicalRecords";
import DoctorSearch from "../pages/patient/DoctorSearch";
import Favorites from "../pages/patient/Favorites";
import ManageUsers from "../pages/admin/ManageUsers";
import VerifyDoctors from "../pages/admin/VerifyDoctors";

import AdminRegister from "../pages/admin/AdminRegister";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminAppointments from "../pages/admin/AdminAppointments";

import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorMyProfile from "../pages/doctor/Profile";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import Reviews from "../pages/doctor/Reviews";
import Availability from "../pages/doctor/Availability";
import Patients from "../pages/doctor/Patients";
import Notifications from "../pages/doctor/Notifications";

/**
 * ARCHITECTURAL NOTE:
 * Role-based Layout Wrapper.
 * This ensures that all dashboard-level pages are wrapped in the DashboardLayout,
 * preventing UI 'trapping' and ensuring a consistent sidebar experience.
 */
const DashboardWrapper = () => {
  const { pathname } = useLocation();
  return (
    <DashboardLayout activePath={pathname}>
      <Outlet />
    </DashboardLayout>
  );
};

const RoleDashboard = () => {
  const { user } = useAuth();
  const role = user?.role || "patient";
  if (role === "doctor") return <DoctorDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <PatientDashboard />;
};

const AuthRoutes = () => {
	const { isAuthenticated } = useAuth();

  return (
    <Routes>
			<Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/portal/register" element={<AdminRegister />} />
      <Route path="/admin/portal/login" element={<AdminLogin />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardWrapper />}>
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payments" element={<Payments />} />
          
          {/* Patient Specific */}
          <Route path="/find-doctors" element={<DoctorSearch />} />
          <Route path="/appointment-history" element={<Appointments />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/book-appointment" element={<Appointments />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Doctor Specific */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/my-profile" element={<DoctorMyProfile />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/reviews" element={<Reviews />} />
          <Route path="/doctor/availability" element={<Availability />} />
          <Route path="/doctor/patients" element={<Patients />} />
          <Route path="/doctor/notifications" element={<Notifications />} />

          {/* Admin Specific */}
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/doctors" element={<VerifyDoctors />} />
        </Route>

        <Route path="/onboarding-survey" element={<OnboardingSurvey />} />
      </Route>

			<Route
				path="*"
				element={<Navigate to={isAuthenticated ? "/dashboard" : "/register"} replace />}
			/>
    </Routes>
  );
};

export default AuthRoutes;