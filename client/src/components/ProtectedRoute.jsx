// Route Guard: restricts unauthenticated access and redirects guests to login.
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {
	const { isAuthenticated } = useAuth();

	// If not authenticated, redirect to /login
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Render child routes
	return <Outlet />;
};

export default ProtectedRoute;

