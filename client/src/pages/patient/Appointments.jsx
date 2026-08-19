import { useEffect, useState, useMemo, useCallback } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";

import DashboardLayout from "../../components/DashboardLayout";
import { getMyAppointments, bookAppointment, cancelAppointment, rescheduleAppointment } from "../../services/appointment.service";
import { getAllDoctors, getAvailableSlotsByDate } from "../../services/doctor.service";
import styles from "./Appointments.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../../components/Pagination";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../components/ToastContext";
import { getImageUrl } from "../../utils/imageUrl";
import { FiCalendar, FiXCircle, FiClock, FiStar, FiCreditCard } from "react-icons/fi";

const STATUS_CLASS = {
	booked: styles.statusBooked,
	confirmed: styles.statusConfirmed,
	completed: styles.statusCompleted,
	cancelled: styles.statusCancelled,
	rescheduled: styles.statusRescheduled,
	reschedule_requested: styles.statusRescheduled, // you might want a distinct style later
};

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

const PatientAppointments = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { addToast } = useToast();
	const { user, refreshUser } = useAuth();
	const [appointments, setAppointments] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
	const [success, setSuccess] = useState("");
	const [filter, setFilter] = useState("all");
	const [showBookModal, setShowBookModal] = useState(false);
	const [showRescheduleModal, setShowRescheduleModal] = useState(false);
	const [rescheduleTarget, setRescheduleTarget] = useState(null);
	const [booking, setBooking] = useState(false);
	const [rescheduling, setRescheduling] = useState(false);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewTarget, setReviewTarget] = useState(null);
	const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
	const [submittingReview, setSubmittingReview] = useState(false);
	const [formData, setFormData] = useState({ doctorId: "", date: "", time: "", reason: "", paymentMode: "prepaid" });
	const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [paymentProcessing, setPaymentProcessing] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState(null);
	const [dynamicSlots, setDynamicSlots] = useState([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [rescheduleSlots, setRescheduleSlots] = useState([]);
	const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
	const [paymentSuccess, setPaymentSuccess] = useState(false);

	const getDayOfWeek = (dateString) => {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const d = new Date(dateString);
		return days[d.getDay()];
	};

	const selectedDoctor = useMemo(() => {
		if (!formData.doctorId) return null;
		return doctors.find((d) => d._id === formData.doctorId) || null;
	}, [formData.doctorId, doctors]);

	const filteredSlots = dynamicSlots;

	useEffect(() => {
		const fetchSlots = async () => {
			if (!formData.doctorId || !formData.date) {
				setDynamicSlots([]);
				return;
			}
			setLoadingSlots(true);
			try {
				const slots = await getAvailableSlotsByDate(formData.doctorId, formData.date);
				setDynamicSlots(slots);
			} catch (err) {
				console.error("Failed to fetch slots:", err);
				addToast("Failed to fetch available slots", "error");
				setDynamicSlots([]);
			} finally {
				setLoadingSlots(false);
			}
		};
		fetchSlots();
	}, [formData.doctorId, formData.date, addToast]);

	useEffect(() => {
		const fetchRescheduleSlots = async () => {
			if (!rescheduleTarget?.doctor?._id && !rescheduleTarget?.doctor) return;
			if (!rescheduleData.date) {
				setRescheduleSlots([]);
				return;
			}
			setLoadingRescheduleSlots(true);
			
			// Always provide standard demo time slots for reschedule since 
			// the doctor needs to approve it based on their actual availability anyway.
			setTimeout(() => {
				const demoSlots = [
					{ _id: 'demo-1', startTime: '09:00', endTime: '10:00' },
					{ _id: 'demo-2', startTime: '10:00', endTime: '11:00' },
					{ _id: 'demo-3', startTime: '11:00', endTime: '12:00' },
					{ _id: 'demo-4', startTime: '14:00', endTime: '15:00' },
					{ _id: 'demo-5', startTime: '15:00', endTime: '16:00' },
					{ _id: 'demo-6', startTime: '16:00', endTime: '17:00' }
				];
				setRescheduleSlots(demoSlots);
				setLoadingRescheduleSlots(false);
			}, 300);
		};
		fetchRescheduleSlots();
	}, [rescheduleData.date, rescheduleTarget]);

	// Auto-open modal if navigating from doctor search
	useEffect(() => {
		if (location.state?.doctorId) {
			setFormData(prev => ({ ...prev, doctorId: location.state.doctorId }));
			setShowBookModal(true);
		}
	}, [location.state]);

	const loadAppointments = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await getMyAppointments({ 
				page: currentPage, 
				limit: itemsPerPage,
				status: filter === 'all' ? undefined : filter
			});
			setAppointments(data.appointments || []);
			setTotalCount(data.total || 0);
			setStats(data.stats || { total: 0, upcoming: 0, completed: 0, cancelled: 0 });
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load appointments.");
		} finally {
			setLoading(false);
		}
	}, [currentPage, filter]);

	const loadDoctors = useCallback(async () => {
		try {
			const data = await getAllDoctors();
			setDoctors(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
		} catch {
			setDoctors([]);
		}
	}, []);

	useEffect(() => {
		loadAppointments();
		loadDoctors();
	}, [loadAppointments, loadDoctors]);

	const filteredAppointments = appointments;

	const handleBookInitiate = (e) => {
		e.preventDefault();
		if (!formData.doctorId || !formData.date || !formData.time) {
			setError("Please select a doctor, date, and time slot.");
			return;
		}
		
		if (formData.paymentMode === 'prepaid') {
			handleRazorpayPayment();
		} else if (formData.paymentMode === 'wallet') {
			const fee = selectedDoctor?.consultationFee || 0;
			if (user.walletBalance < fee) {
				addToast(`Insufficient wallet balance. You need ₹${fee} but have ₹${user.walletBalance}`, "error");
				return;
			}
			handleBook();
		} else {
			handleBook();
		}
	};

	const handleBook = async () => {
		setBooking(true);
		setError("");
		setSuccess("");
		try {
			await bookAppointment(formData);
			addToast("Appointment booked successfully! Your doctor will confirm shortly.", "success");
			setShowBookModal(false);
			setShowPaymentModal(false);
			setFormData({ doctorId: "", date: "", time: "", reason: "", paymentMode: "prepaid" });
			setSelectedSlot(null);
			loadAppointments();
			if (typeof refreshUser === 'function') {
				await refreshUser();
			}
			navigate('/appointment-history', { replace: true });
		} catch (err) {
			setBooking(false);
			setError(err?.response?.data?.message || "Failed to book appointment.");
		} finally {
			setBooking(false);
		}
	};

	const handleMockPayment = async () => {
		setPaymentProcessing(true);
		setTimeout(() => {
			setPaymentProcessing(false);
			setPaymentSuccess(true);
			setTimeout(() => {
				setPaymentSuccess(false);
				handleBook();
			}, 1500);
		}, 1500);
	};

	const handleRazorpayPayment = async () => {
		try {
			const fee = selectedDoctor?.consultationFee || 0;
			if (fee === 0) {
				return handleBook();
			}

			// If no real Razorpay key is configured, fallback to the demo mock modal
			const razorpayKey = "dummy_key_id"; // Replace with your actual Razorpay Key ID
			if (razorpayKey === "dummy_key_id") {
				setShowPaymentModal(true);
				return;
			}

			setPaymentProcessing(true);
			const { data } = await api.post("/api/payments/create-order", {
				amount: fee,
				currency: "INR"
			});
			
			const order = data.order;

			const options = {
				key: razorpayKey,
				amount: order.amount,
				currency: order.currency,
				name: "MediSync",
				description: "Appointment Booking",
				order_id: order.id,
				handler: async function (response) {
					try {
						const verifyRes = await api.post("/api/payments/verify-payment", {
							razorpay_order_id: response.razorpay_order_id,
							razorpay_payment_id: response.razorpay_payment_id,
							razorpay_signature: response.razorpay_signature
						});
						
						if (verifyRes.data.success) {
							handleBook();
						}
					} catch (err) {
						addToast("Payment verification failed", "error");
					}
				},
				prefill: {
					name: user?.name,
					email: user?.email,
					contact: user?.phone || "9999999999"
				},
				theme: {
					color: "#0284c7"
				}
			};
			
			const rzp = new window.Razorpay(options);
			rzp.on('payment.failed', function (response){
				addToast("Payment failed", "error");
				setPaymentProcessing(false);
			});
			rzp.open();
		} catch (error) {
			console.error("Razorpay error", error);
			addToast("Failed to initiate payment", "error");
			setPaymentProcessing(false);
		}
	};

	const handleCancel = (id) => {
		setCancelTargetId(id);
		setShowCancelDialog(true);
	};

	const confirmCancel = async () => {
		if (!cancelTargetId) return;
		setError("");
		setSuccess("");
		try {
			await cancelAppointment(cancelTargetId);
			setSuccess("Appointment cancelled successfully.");
			await loadAppointments();
			await refreshUser();
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to cancel appointment.");
		} finally {
			setShowCancelDialog(false);
			setCancelTargetId(null);
		}
	};

	const handleReschedule = async (e) => {
		e.preventDefault();
		if (!rescheduleTarget) return;
		setRescheduling(true);
		setError("");
		setSuccess("");
		try {
			await rescheduleAppointment(rescheduleTarget._id, rescheduleData);
			setSuccess("Appointment rescheduled successfully.");
			setShowRescheduleModal(false);
			setRescheduleTarget(null);
			await loadAppointments();
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to reschedule appointment.");
		} finally {
			setRescheduling(false);
		}
	};

	const getDoctorName = (appointment) => {
		if (appointment?.doctor?.user?.name) return appointment.doctor.user.name;
		if (appointment?.doctor?.name) return appointment.doctor.name;
		return "Assigned Doctor";
	};

	const getDoctorSpec = (appointment) => {
		return appointment?.doctor?.specialization || "General Consultation";
	};

	const handleReviewSubmit = async (e) => {
		e.preventDefault();
		setSubmittingReview(true);
		try {
			await api.post("/api/reviews", {
				doctorId: reviewTarget.doctor?.user?._id || reviewTarget.doctor?.user || reviewTarget.doctor,
				rating: reviewData.rating,
				comment: reviewData.comment
			});
			addToast("Review submitted successfully", "success");
			setShowReviewModal(false);
			setReviewData({ rating: 5, comment: "" });
		} catch (err) {
			addToast(err.response?.data?.message || "Failed to submit review", "error");
		} finally {
			setSubmittingReview(false);
		}
	};

	const filters = [
		{ key: "all", label: "All", count: stats.total },
		{ key: "upcoming", label: "Upcoming", count: stats.upcoming },
		{ key: "completed", label: "Completed", count: stats.completed },
		{ key: "cancelled", label: "Cancelled", count: stats.cancelled },
	];

	return (
		<>
			<div className={styles.header}>
				<div>
					<h1 className={styles.headerTitle}>My Appointments</h1>
					<p className={styles.headerSubtitle}>Manage your healthcare schedule and book new visits.</p>
				</div>
				<button className={styles.btnPrimary} onClick={() => setShowBookModal(true)}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
					Book Appointment
				</button>
			</div>

			{error ? <div className={styles.errorMsg}>{error}<button className={styles.msgClose} onClick={() => setError("")}>×</button></div> : null}
			{success ? <div className={styles.successMsg}>{success}<button className={styles.msgClose} onClick={() => setSuccess("")}>×</button></div> : null}

			<div className={styles.statsRow}>
				<div className={styles.statMini}>
					<div className={styles.statMiniValue}>{stats.total}</div>
					<div className={styles.statMiniLabel}>Total</div>
				</div>
				<div className={styles.statMini}>
					<div className={styles.statMiniValue} style={{ color: "var(--brand-primary)" }}>{stats.upcoming}</div>
					<div className={styles.statMiniLabel}>Upcoming</div>
				</div>
				<div className={styles.statMini}>
					<div className={styles.statMiniValue} style={{ color: "#7b1fa2" }}>{stats.completed}</div>
					<div className={styles.statMiniLabel}>Completed</div>
				</div>
				<div className={styles.statMini}>
					<div className={styles.statMiniValue} style={{ color: "#c62828" }}>{stats.cancelled}</div>
					<div className={styles.statMiniLabel}>Cancelled</div>
				</div>
			</div>

			<div className={styles.filterTabs}>
				{filters.map((f) => (
					<button key={f.key} className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ""}`} onClick={() => setFilter(f.key)}>
						{f.label} ({f.count})
					</button>
				))}
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading appointments...</div>
			) : filteredAppointments.length === 0 ? (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
					</div>
					<h3 className={styles.emptyTitle}>No appointments found</h3>
					<p className={styles.emptyText}>
						{filter === "all" ? "You haven't booked any appointments yet." : `No ${filter} appointments to show.`}
					</p>
					{filter === "all" && (
						<button className={styles.btnPrimary} style={{ margin: "0 auto" }} onClick={() => setShowBookModal(true)}>Book Your First Appointment</button>
					)}
				</div>
			) : (
				<div className={styles.appointmentsList}>
					{filteredAppointments.map((appt) => (
						<div className={styles.appointmentCard} key={appt._id}>
							<div className={styles.appointmentIcon}>
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
							</div>
							<div className={styles.appointmentInfo}>
								<div className={styles.doctorName}>{getDoctorName(appt)}</div>
								<div className={styles.appointmentMeta}>
									<span>{getDoctorSpec(appt)}</span>
									{appt.consultationFee > 0 && (
										<span className={styles.feeTag}>₹{appt.consultationFee}</span>
									)}
									{appt.reason ? <span>• {appt.reason}</span> : null}
									{appt.paymentMode && (
										<span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', marginLeft: '8px' }}>
											{appt.paymentMode === 'prepaid' ? 'Prepaid' : 'Pay Later'}
										</span>
									)}
								</div>
							</div>
							<div className={styles.dateTimeBlock}>
								<div className={styles.dateText}>
									<FiCalendar size={14} />
									{formatDate(appt.date)}
								</div>
								<div className={styles.timeText}>
									<FiClock size={14} />
									{appt.time || "-"}
								</div>
							</div>
							<span className={`${styles.statusPill} ${STATUS_CLASS[appt.status] || styles.statusBooked}`}>
								{appt.status === 'reschedule_requested' ? 'Pending' : appt.status || "booked"}
							</span>
							<div className={styles.appointmentActions}>
								{appt.status === "booked" && (
									<>
										<button 
											className={styles.btnSecondary} 
											onClick={() => {
												setRescheduleTarget(appt);
												setRescheduleData({ date: appt.date || "", time: appt.time || "" });
												setShowRescheduleModal(true);
											}}
										>
											<FiCalendar size={16} />
											Reschedule
										</button>
										<button 
											className={styles.btnDanger} 
											onClick={() => handleCancel(appt._id)}
										>
											<FiXCircle size={16} />
											Cancel
										</button>
									</>
								)}
								{(appt.status === "completed" || appt.status === "confirmed") && (
									<button 
										className={styles.btnReview} 
										onClick={() => {
											setReviewTarget(appt);
											setShowReviewModal(true);
										}}
									>
										<FiStar size={16} />
										Leave Review
									</button>
								)}
							</div>
						</div>
					))}
					
					{totalCount > itemsPerPage && (
						<div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
							<Pagination 
								currentPage={currentPage}
								totalPages={Math.ceil(totalCount / itemsPerPage)}
								onPageChange={setCurrentPage}
							/>
						</div>
					)}
				</div>
			)}

			{/* Book Appointment Modal */}
			{showBookModal && (
				<div className={styles.modalOverlay} onClick={() => setShowBookModal(false)}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<h2 className={styles.modalTitle}>Book New Appointment</h2>
						<form onSubmit={handleBookInitiate}>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Doctor</label>
								<select
									className={styles.formSelect}
									value={formData.doctorId}
									onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
									required
								>
									<option value="">Select a doctor...</option>
									{doctors.map((doc) => (
										<option key={doc._id} value={doc._id}>
											{doc?.user?.name || "Doctor"} — {doc.specialization} {doc.consultationFee ? `(₹${doc.consultationFee})` : ""}
										</option>
									))}
								</select>
							</div>

							{selectedDoctor && (
								<div className={styles.doctorPreview}>
									<div className={styles.doctorPreviewAvatar}>
										{selectedDoctor?.user?.profilePicture ? (
											<img src={getImageUrl(selectedDoctor.user.profilePicture)} alt="" style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} />
										) : (
											(selectedDoctor?.user?.name || "D").charAt(0).toUpperCase()
										)}
									</div>
									<div className={styles.doctorPreviewInfo}>
										<div className={styles.doctorPreviewName}>{selectedDoctor?.user?.name || "Doctor"}</div>
										<div className={styles.doctorPreviewSpec}>{selectedDoctor.specialization}</div>
									</div>
									<div className={styles.doctorPreviewFee}>
										<div className={styles.doctorPreviewFeeValue}>₹{selectedDoctor.consultationFee || 0}</div>
										<div className={styles.doctorPreviewFeeLabel}>Consultation</div>
									</div>
								</div>
							)}

							<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Select Date</label>
									<input 
										type="date" 
										className={styles.formInput} 
										value={formData.date} 
										onChange={(e) => {
											setFormData({ ...formData, date: e.target.value, time: "" });
											setSelectedSlot(null);
										}} 
										min={new Date().toISOString().split("T")[0]} 
										required 
									/>
								</div>
								
								{formData.date && (
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Available Slots for {getDayOfWeek(formData.date)}</label>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
											{loadingSlots ? (
												<p style={{ fontSize: '0.85rem', color: 'var(--brand-primary)' }}>Loading available slots...</p>
											) : filteredSlots.length > 0 ? (
												filteredSlots.map((slot) => (
													<button
														key={slot._id}
														type="button"
														onClick={() => {
															setFormData({ ...formData, time: slot.startTime });
															setSelectedSlot(slot._id);
														}}
														style={{
															padding: '8px 16px',
															borderRadius: '8px',
															border: '2px solid',
															borderColor: selectedSlot === slot._id ? 'var(--brand-primary)' : '#e2e8f0',
															background: selectedSlot === slot._id ? 'var(--brand-primary)' : 'white',
															color: selectedSlot === slot._id ? 'white' : 'var(--text-main)',
															cursor: 'pointer',
															fontWeight: 600,
															fontSize: '0.85rem',
															transition: 'all 0.2s'
														}}
													>
														{slot.startTime} - {slot.endTime}
													</button>
												))
											) : (
												<p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>No slots available for this day.</p>
											)}
										</div>
									</div>
								)}
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Reason (Optional)</label>
								<textarea className={styles.formTextarea} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for visit..." />
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Payment Method</label>
								<div className={styles.paymentOptions}>
									<div 
										className={`${styles.paymentCard} ${formData.paymentMode === 'wallet' ? styles.paymentCardActive : ''}`}
										onClick={() => setFormData({ ...formData, paymentMode: 'wallet' })}
									>
										<div className={styles.paymentCardIcon}><FiCreditCard /></div>
										<div className={styles.paymentCardLabel}>Wallet</div>
										<div className={styles.walletBalanceInfo}>Bal: ₹{user?.walletBalance || 0}</div>
									</div>
									<div 
										className={`${styles.paymentCard} ${formData.paymentMode === 'prepaid' ? styles.paymentCardActive : ''}`}
										onClick={() => setFormData({ ...formData, paymentMode: 'prepaid' })}
									>
										<div className={styles.paymentCardIcon}><FiCreditCard /></div>
										<div className={styles.paymentCardLabel}>Card</div>
									</div>
									<div 
										className={`${styles.paymentCard} ${formData.paymentMode === 'pay_later' ? styles.paymentCardActive : ''}`}
										onClick={() => setFormData({ ...formData, paymentMode: 'pay_later' })}
									>
										<div className={styles.paymentCardIcon}><FiClock /></div>
										<div className={styles.paymentCardLabel}>Later</div>
									</div>
								</div>
							</div>

							<div className={styles.modalActions}>
								<button type="submit" className={styles.btnSubmit} disabled={booking || (formData.date && filteredSlots.length === 0)}>
									{booking ? "Processing..." : formData.paymentMode === 'prepaid' ? "Pay & Confirm" : "Confirm Booking"}
								</button>
								<button type="button" className={styles.btnClose} onClick={() => setShowBookModal(false)}>Cancel</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Reschedule Modal */}
			{showRescheduleModal && rescheduleTarget && (
				<div className={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<h2 className={styles.modalTitle}>Request Reschedule</h2>
						<form onSubmit={handleReschedule}>
							<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>New Date</label>
									<input 
										type="date" 
										className={styles.formInput} 
										value={rescheduleData.date} 
										onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value, time: "" })} 
										min={new Date().toISOString().split("T")[0]} 
										required 
									/>
								</div>
								
								{rescheduleData.date && (
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Available Slots</label>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
											{loadingRescheduleSlots ? (
												<p style={{ fontSize: '0.85rem', color: 'var(--brand-primary)' }}>Loading slots...</p>
											) : rescheduleSlots.length > 0 ? (
												rescheduleSlots.map((slot) => (
													<button
														key={slot._id}
														type="button"
														onClick={() => setRescheduleData({ ...rescheduleData, time: slot.startTime })}
														style={{
															padding: '8px 16px',
															borderRadius: '8px',
															border: '2px solid',
															borderColor: rescheduleData.time === slot.startTime ? 'var(--brand-primary)' : '#e2e8f0',
															background: rescheduleData.time === slot.startTime ? 'var(--brand-primary)' : 'white',
															color: rescheduleData.time === slot.startTime ? 'white' : 'var(--text-main)',
															cursor: 'pointer',
															fontWeight: 600,
															fontSize: '0.85rem',
															transition: 'all 0.2s'
														}}
													>
														{slot.startTime} - {slot.endTime}
													</button>
												))
											) : (
												<p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>No slots available for this day.</p>
											)}
										</div>
									</div>
								)}
							</div>
							<div className={styles.modalActions}>
								<button type="submit" className={styles.btnSubmit} disabled={rescheduling || !rescheduleData.time}>Submit Request</button>
								<button type="button" className={styles.btnClose} onClick={() => setShowRescheduleModal(false)}>Cancel</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showReviewModal && reviewTarget && (
				<div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
					<div className={styles.modal} style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalTitle}>Share Your Experience</div>
						<p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
							How was your consultation with {getDoctorName(reviewTarget)}?
						</p>
						<form onSubmit={handleReviewSubmit}>
							<div className={styles.starRating}>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										className={`${styles.starBtn} ${reviewData.rating >= star ? styles.starActive : ""}`}
										onClick={() => setReviewData({ ...reviewData, rating: star })}
									>
										<FiStar size={32} fill={reviewData.rating >= star ? "currentColor" : "none"} />
									</button>
								))}
							</div>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Your Review</label>
								<textarea 
									value={reviewData.comment} 
									onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })} 
									className={styles.reviewTextarea} 
									placeholder="Tell us about the care you received..."
								/>
							</div>
							<div className={styles.modalActions}>
								<button type="submit" className={styles.btnSubmit} disabled={submittingReview}>
									{submittingReview ? 'Submitting...' : 'Post Review'}
								</button>
								<button type="button" className={styles.btnClose} onClick={() => setShowReviewModal(false)}>Cancel</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Demo Payment Modal */}
			{showPaymentModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center' }}>
						{paymentSuccess ? (
							<div style={{ padding: '40px 20px' }}>
								<div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
									<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
								</div>
								<h2 style={{ margin: '0 0 12px 0', color: '#16a34a' }}>Transaction Complete!</h2>
								<p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your payment was successful. Redirecting...</p>
							</div>
						) : (
							<>
								<div style={{ marginBottom: '24px' }}>
									<div style={{ width: '60px', height: '60px', background: '#e0f2fe', color: '#0369a1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
									</div>
									<h2 style={{ margin: 0 }}>Razorpay Demo Payment</h2>
									<p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
										Completing dummy payment of <strong>₹{selectedDoctor?.consultationFee || 0}</strong> for your appointment.
									</p>
								</div>

								<div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'left' }}>
									<div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Payment Method</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<div style={{ width: '40px', height: '24px', background: '#1e293b', borderRadius: '4px' }}></div>
										<div style={{ fontWeight: 600 }}>•••• •••• •••• 4242</div>
									</div>
								</div>

								<div className={styles.modalActions} style={{ flexDirection: 'column' }}>
									<button 
										onClick={handleMockPayment} 
										className={styles.btnSubmit} 
										disabled={paymentProcessing}
										style={{ width: '100%' }}
									>
										{paymentProcessing ? "Processing Transaction..." : "Simulate Payment"}
									</button>
									<button 
										onClick={() => setShowPaymentModal(false)} 
										className={styles.btnClose}
										style={{ width: '100%' }}
									>
										Cancel
									</button>
								</div>
								
								<div style={{ marginTop: '20px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
									Secured by MediSync Demo
								</div>
							</>
						)}
					</div>
				</div>
			)}
			<ConfirmDialog
				open={showCancelDialog}
				title="Cancel Appointment?"
				message="Are you sure you want to cancel this appointment? This action will refund the amount to your wallet."
				onConfirm={confirmCancel}
				onCancel={() => { setShowCancelDialog(false); setCancelTargetId(null); }}
			/>
		</>
	);
};

export default PatientAppointments;
