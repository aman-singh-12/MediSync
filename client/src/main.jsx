import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./styles/global.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<AppErrorBoundary>
				<BrowserRouter>
					<AuthProvider>
						<ToastProvider>
							<App />
						</ToastProvider>
					</AuthProvider>
				</BrowserRouter>
			</AppErrorBoundary>
		</GoogleOAuthProvider>
	</React.StrictMode>
);
