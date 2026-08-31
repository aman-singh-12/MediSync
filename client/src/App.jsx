import React, { useEffect } from "react";
import AuthRoutes from "./routes/AuthRoutes";
import useAuth from "./hooks/useAuth";
import { useToast } from "./components/ToastContext";
import { io } from "socket.io-client";

// Initialize Socket.IO client connection
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

const App = () => {
	const { user, isAuthenticated } = useAuth();
	const { addToast } = useToast();

	// Authenticate user on socket connection when logged in
	useEffect(() => {
		if (isAuthenticated && user) {
			socket.emit("authenticate", user._id);
		}
	}, [isAuthenticated, user]);

	// Listen for real-time appointment socket notifications and display toast alerts
	useEffect(() => {
		const handleNotification = (data) => {
			addToast(data.message || data.title, "info");
		};

		socket.on("appointment.created", handleNotification);
		socket.on("appointment.updated", handleNotification);
		socket.on("appointment.cancelled", handleNotification);
		socket.on("appointment.rescheduled", handleNotification);

		// Clean up socket listeners on unmount
		return () => {
			socket.off("appointment.created", handleNotification);
			socket.off("appointment.updated", handleNotification);
			socket.off("appointment.cancelled", handleNotification);
			socket.off("appointment.rescheduled", handleNotification);
		};
	}, [addToast]);

	// Render application routes
	return <AuthRoutes />;
};

export default App;

