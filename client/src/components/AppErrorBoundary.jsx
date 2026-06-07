import React from "react";

class AppErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			errorMessage: "",
		};
	}

	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			errorMessage: error?.message || "Unexpected rendering error.",
		};
	}

	componentDidCatch(error, errorInfo) {
		console.error("Application render error", error, errorInfo);
	}

	handleReset = () => {
		try {
			localStorage.removeItem("medisync_token");
			localStorage.removeItem("medisync_user");
		} catch {
			// Ignore storage errors and still reload.
		}

		window.location.href = "/login";
	};

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		return (
			<div
				style={{
					minHeight: "100vh",
					display: "grid",
					placeItems: "center",
					padding: "24px",
				}}
			>
				<div
					style={{
						width: "min(560px, 100%)",
						background: "#fff",
						border: "1px solid #cfe0f2",
						borderRadius: "16px",
						padding: "24px",
						boxShadow: "0 14px 30px rgba(23, 68, 122, 0.18)",
					}}
				>
					<h2 style={{ margin: "0 0 8px", color: "#123f6d" }}>MediSync could not render this view</h2>
					<p style={{ margin: "0 0 14px", color: "#3f6288" }}>
						A runtime error occurred. Reset local app state and reload.
					</p>
					<p
						style={{
							margin: "0 0 16px",
							padding: "10px 12px",
							borderRadius: "10px",
							background: "#f4f9ff",
							border: "1px solid #d7e8f9",
							color: "#2c588a",
							fontSize: "0.92rem",
						}}
					>
						{this.state.errorMessage}
					</p>
					<button
						type="button"
						onClick={this.handleReset}
						style={{
							border: "none",
							borderRadius: "10px",
							padding: "10px 14px",
							background: "#1f71cc",
							color: "#fff",
							fontWeight: 700,
							cursor: "pointer",
						}}
					>
						Reset and Reload
					</button>
				</div>
			</div>
		);
	}
}

export default AppErrorBoundary;