import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AppErrorBoundary>
			<BrowserRouter>
				<AuthProvider>
					<ToastProvider>
						<App />
					</ToastProvider>
				</AuthProvider>
			</BrowserRouter>
		</AppErrorBoundary>
	</React.StrictMode>
);
