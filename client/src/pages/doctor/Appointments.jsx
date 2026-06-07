import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { getDoctorAppointments, updateAppointmentStatus } from "../../services/appointment.service";
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

const DoctorAppointments = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [filter, setFilter] = useState("all");
	const [showNotesModal, setShowNotesModal] = useState(false);
	const [notesTarget, setNotesTarget] = useState(null);
	const [notesText, setNotesText] = useState("");
	const [completing, setCompleting] = useState(false);

	const todayStr = new Date().toISOString().split("T")[0];

	useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 4000); return () => clearTimeout(t); } }, [error]);
	useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(""), 4000); return () => clearTimeout(t); } }, [success]);

	const loadAppointments = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await getDoctorAppointments();
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
		today: appointments.filter((a) => a.date === todayStr && a.status !== "cancelled").length,
		pending: appointments.filter((a) => ["booked", "rescheduled"].includes(a.status)).length,
		confirmed: appointments.filter((a) => a.status === "confirmed").length,
	}), [appointments, todayStr]);

	const filteredAppointments = useMemo(() => {
		if (filter === "all") return appointments;
		if (filter === "today") return appointments.filter((a) => a.date === todayStr);
		if (filter === "upcoming") return appointments.filter((a) => ["booked", "confirmed", "rescheduled"].includes(a.status));
		if (filter === "completed") return appointments.filter((a) => a.status === "completed");
		return appointments;
	}, [appointments, filter, todayStr]);

	const handleStatusChange = async (id, status) => {
		setError("");
		setSuccess("");
		try {
			await updateAppointmentStatus(id, status);
			setSuccess(`Appointment ${status} successfully.`);
			await loadAppointments();
		} catch (err) {
			setError(err?.response?.data?.message || `Failed to update appointment.`);
		}
	};

	const openCompleteWithNotes = (appt) => {
		setNotesTarget(appt);
		setNotesText(appt.notes || "");
		setShowNotesModal(true);
	};

	const handleCompleteWithNotes = async (e) => {
		e.preventDefault();
		if (!notesTarget) return;
		setCompleting(true);
		setError("");
		setSuccess("");
		try {
			await updateAppointmentStatus(notesTarget._id, "completed", notesText);
			setSuccess("Appointment completed with notes saved.");
			setShowNotesModal(false);
			setNotesTarget(null);
			await loadAppointments();
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to complete appointment.");
		} finally {
			setCompleting(false);
		}
	};

	const filters = [
		{ key: "all", label: "All", count: stats.total },
		{ key: "today", label: "Today", count: stats.today },
		{ key: "upcoming", label: "Upcoming", count: stats.pending + stats.confirmed },
		{ key: "completed", label: "Completed" },
	];

	return (
		<>
			<div className={styles.header}>
				<div>
					<h1 className={styles.headerTitle}>My Schedule</h1>
					<p className={styles.headerSubtitle}>Manage patient appointments and update their status.</p>
				</div>
				<button className={styles.btnRefresh} onClick={loadAppointments}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
					Refresh
				</button>
			</div>

			{error ? <div className={styles.errorMsg}>{error}<button className={styles.msgClose} onClick={() => setError("")}>×</button></div> : null}
			{success ? <div className={styles.successMsg}>{success}<button className={styles.msgClose} onClick={() => setSuccess("")}>×</button></div> : null}

			{/* Stats Row */}
			<div className={styles.statsRow}>
				<div className={styles.statMini}><div className={styles.statMiniValue}>{stats.total}</div><div className={styles.statMiniLabel}>Total</div></div>
				<div className={styles.statMini}><div className={styles.statMiniValue} style={{ color: "var(--bg-dark)" }}>{stats.today}</div><div className={styles.statMiniLabel}>Today</div></div>
				<div className={styles.statMini}><div className={styles.statMiniValue} style={{ color: "#f57f17" }}>{stats.pending}</div><div className={styles.statMiniLabel}>Pending</div></div>
				<div className={styles.statMini}><div className={styles.statMiniValue} style={{ color: "#2e7d32" }}>{stats.confirmed}</div><div className={styles.statMiniLabel}>Confirmed</div></div>
			</div>

			<div className={styles.filterTabs}>
				{filters.map((f) => (
					<button key={f.key} className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ""}`} onClick={() => setFilter(f.key)}>
						{f.label}
						{f.count !== undefined && <span className={styles.filterCount}>{f.count}</span>}
					</button>
				))}
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading appointments...</div>
			) : filteredAppointments.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
					<h3 className={styles.emptyTitle}>No appointments found</h3>
					<p className={styles.emptyText}>{filter === "today" ? "No appointments scheduled for today." : "No appointments in this category."}</p>
				</div>
			) : (
				<div className={styles.appointmentsList}>
					{filteredAppointments.map((appt) => (
						<div className={styles.appointmentCard} key={appt._id}>
							<div className={styles.patientAvatar}>
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
							</div>
							<div className={styles.appointmentInfo}>
								<div className={styles.patientName}>{appt?.patient?.name || "Patient"}</div>
								<div className={styles.appointmentMeta}>
									{appt?.patient?.email || ""}
									{appt.reason ? ` • ${appt.reason}` : ""}
									{appt.consultationFee > 0 && <span className={styles.feeTag}>₹{appt.consultationFee}</span>}
								</div>
								{appt.notes && <div style={{ fontSize: "0.8rem", color: "#7b1fa2", marginTop: "4px", fontStyle: "italic" }}>Notes: {appt.notes}</div>}
							</div>
							<div className={styles.dateTimeBlock}>
								<div className={styles.dateText}>{formatDate(appt.date)}</div>
								<div className={styles.timeText}>{appt.time || "-"}</div>
							</div>
							<span className={`${styles.statusPill} ${STATUS_CLASS[appt.status] || styles.statusBooked}`}>{appt.status}</span>
							<div className={styles.actionBtns}>
								{(appt.status === "booked" || appt.status === "rescheduled") && (
									<button className={styles.btnConfirm} onClick={() => handleStatusChange(appt._id, "confirmed")}>Confirm</button>
								)}
								{["booked", "confirmed", "rescheduled"].includes(appt.status) && (
									<button className={styles.btnComplete} onClick={() => openCompleteWithNotes(appt)}>Complete</button>
								)}
								{!["cancelled", "completed"].includes(appt.status) && (
									<button className={styles.btnCancel} onClick={() => handleStatusChange(appt._id, "cancelled")}>Cancel</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Complete with Notes Modal */}
			{showNotesModal && notesTarget && (
				<div className={styles.modalOverlay} onClick={() => setShowNotesModal(false)}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<h2 className={styles.modalTitle}>Complete Appointment</h2>
						<p className={styles.modalSubtitle}>Add notes for {notesTarget?.patient?.name || "this patient"}'s visit.</p>
						<form onSubmit={handleCompleteWithNotes}>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Doctor Notes (Optional)</label>
								<textarea className={styles.formTextarea} value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Diagnosis, prescription, follow-up instructions..." style={{ minHeight: "120px" }} />
							</div>
							<div className={styles.modalActions}>
								<button type="submit" className={styles.btnSubmit} disabled={completing}>{completing ? "Saving..." : "Mark as Completed"}</button>
								<button type="button" className={styles.btnClose} onClick={() => setShowNotesModal(false)}>Cancel</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default DoctorAppointments;
