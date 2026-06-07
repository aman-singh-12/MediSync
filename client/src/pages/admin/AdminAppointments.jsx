import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getAllAppointments, updateAppointmentStatus } from "../../services/appointment.service";
import styles from "./Appointments.module.css";

const STATUS_CLASS = {
	booked: styles.statusBooked,
	confirmed: styles.statusConfirmed,
	completed: styles.statusCompleted,
	cancelled: styles.statusCancelled,
	rescheduled: styles.statusRescheduled,
};

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

const AdminAppointments = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [filter, setFilter] = useState("all");
	const [search, setSearch] = useState("");

	useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 4000); return () => clearTimeout(t); } }, [error]);
	useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(""), 4000); return () => clearTimeout(t); } }, [success]);

	const loadAppointments = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await getAllAppointments();
			setAppointments(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load appointments.");
			setAppointments([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { loadAppointments(); }, [loadAppointments]);

	const stats = useMemo(() => ({
		total: appointments.length,
		booked: appointments.filter((a) => a.status === "booked" || a.status === "rescheduled").length,
		confirmed: appointments.filter((a) => a.status === "confirmed").length,
		completed: appointments.filter((a) => a.status === "completed").length,
		cancelled: appointments.filter((a) => a.status === "cancelled").length,
	}), [appointments]);

	const filteredAppointments = useMemo(() => {
		let list = appointments;
		if (filter !== "all") {
			if (filter === "booked") list = list.filter((a) => a.status === "booked" || a.status === "rescheduled");
			else list = list.filter((a) => a.status === filter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter((a) => {
				const patient = (a?.patient?.name || "").toLowerCase();
				const doctor = (a?.doctor?.user?.name || a?.doctor?.name || "").toLowerCase();
				const email = (a?.patient?.email || "").toLowerCase();
				return patient.includes(q) || doctor.includes(q) || email.includes(q);
			});
		}
		return list;
	}, [appointments, filter, search]);

	const handleStatusChange = async (id, status) => {
		const label = status === "cancelled" ? "cancel" : status;
		if (status === "cancelled" && !window.confirm("Cancel this appointment?")) return;
		setError("");
		setSuccess("");
		try {
			await updateAppointmentStatus(id, status);
			setSuccess(`Appointment ${label}${status.endsWith("d") ? "" : "ed"} successfully.`);
			await loadAppointments();
		} catch (err) {
			setError(err?.response?.data?.message || `Failed to ${label}.`);
		}
	};

	const getPatientName = (appt) => appt?.patient?.name || "Unknown Patient";
	const getPatientEmail = (appt) => appt?.patient?.email || "";
	const getDoctorName = (appt) => {
		if (appt?.doctor?.user?.name) return appt.doctor.user.name;
		if (appt?.doctor?.name) return appt.doctor.name;
		return "Unassigned";
	};
	const getDoctorSpec = (appt) => appt?.doctor?.specialization || "";

	const filters = [
		{ key: "all", label: "All", count: stats.total },
		{ key: "booked", label: "Booked", count: stats.booked },
		{ key: "confirmed", label: "Confirmed", count: stats.confirmed },
		{ key: "completed", label: "Completed", count: stats.completed },
		{ key: "cancelled", label: "Cancelled", count: stats.cancelled },
	];

	return (
		<>
			<div className={styles.header}>
				<div>
					<h1 className={styles.headerTitle}>All Appointments</h1>
					<p className={styles.headerSubtitle}>View and manage all appointments across the platform.</p>
				</div>
				<button className={styles.btnRefresh} onClick={loadAppointments}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
					Refresh
				</button>
			</div>

			{error ? <div className={styles.errorMsg}>{error}<button className={styles.msgClose} onClick={() => setError("")}>×</button></div> : null}
			{success ? <div className={styles.successMsg}>{success}<button className={styles.msgClose} onClick={() => setSuccess("")}>×</button></div> : null}

			{/* Search */}
			<div className={styles.searchBar}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
				<input type="text" placeholder="Search by patient or doctor name..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
				{search && <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>}
			</div>

			<div className={styles.filterTabs}>
				{filters.map((f) => (
					<button key={f.key} className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ""}`} onClick={() => setFilter(f.key)}>
						{f.label} ({f.count})
					</button>
				))}
			</div>

			<div className={styles.tableSection}>
				{loading ? (
					<div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading appointments...</div>
				) : filteredAppointments.length === 0 ? (
					<div className={styles.emptyState}>
						<div className={styles.emptyIcon}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
						<h3 className={styles.emptyTitle}>No appointments found</h3>
						<p className={styles.emptyText}>{search ? "No results match your search." : "No appointments match the selected filter."}</p>
					</div>
				) : (
					<>
						<table className={styles.table}>
							<thead>
								<tr>
									<th>Patient</th>
									<th>Doctor</th>
									<th>Date & Time</th>
									<th>Fee</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredAppointments.map((appt) => (
									<tr key={appt._id}>
										<td>
											<div className={styles.personCell}>
												<div className={`${styles.personAvatar} ${styles.avatarPatient}`}>{getPatientName(appt).charAt(0).toUpperCase()}</div>
												<div>
													<div className={styles.personName}>{getPatientName(appt)}</div>
													<div className={styles.personEmail}>{getPatientEmail(appt)}</div>
												</div>
											</div>
										</td>
										<td>
											<div className={styles.personCell}>
												<div className={`${styles.personAvatar} ${styles.avatarDoctor}`}>{getDoctorName(appt).charAt(0).toUpperCase()}</div>
												<div>
													<div className={styles.personName}>{getDoctorName(appt)}</div>
													<div className={styles.personEmail}>{getDoctorSpec(appt)}</div>
												</div>
											</div>
										</td>
										<td>
											<div style={{ fontWeight: 600 }}>{formatDate(appt.date)}</div>
											<div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{appt.time || "-"}</div>
										</td>
										<td>
											{appt.consultationFee > 0 ? <span style={{ fontWeight: 700, color: "#f57f17" }}>₹{appt.consultationFee}</span> : <span style={{ color: "var(--text-secondary)" }}>—</span>}
										</td>
										<td>
											<span className={`${styles.statusPill} ${STATUS_CLASS[appt.status] || styles.statusBooked}`}>{appt.status}</span>
										</td>
										<td>
											<div className={styles.actionBtns}>
												{(appt.status === "booked" || appt.status === "rescheduled") && (
													<button className={styles.btnConfirm} onClick={() => handleStatusChange(appt._id, "confirmed")}>Confirm</button>
												)}
												{["booked", "confirmed", "rescheduled"].includes(appt.status) && (
													<button className={styles.btnComplete} onClick={() => handleStatusChange(appt._id, "completed")}>Complete</button>
												)}
												{!["cancelled", "completed"].includes(appt.status) && (
													<button className={styles.btnCancel} onClick={() => handleStatusChange(appt._id, "cancelled")}>Cancel</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className={styles.tableFooter}>
							<div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
								Showing {filteredAppointments.length} of {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
							</div>
						</div>
					</>
				)}
			</div>
		</>
	);
};

export default AdminAppointments;
