import styles from "./Payments.module.css";
import { useEffect, useMemo, useState } from "react";
import { getMyPayments } from "../services/payment.service";
import api from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../components/ToastContext";
import useAuth from "../hooks/useAuth";

const formatCurrency = (value) => {
	return `₹${Number(value || 0).toFixed(2)}`;
};

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatMethod = (value) => {
	if (!value) return "-";
	return String(value)
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

const STATUS_CLASS = {
	paid: styles.statusPaid,
	pending: styles.statusPending,
	failed: styles.statusFailed,
	refunded: styles.statusRefunded,
};

// ─── Payment Detail Modal ──────────────────────────────────────────────────────
const PaymentDetailModal = ({ payment, onClose, isDoctor }) => {
	if (!payment) return null;

	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
				display: "flex", alignItems: "center", justifyContent: "center",
				zIndex: 9999, padding: "16px",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					background: "white", borderRadius: "20px", padding: "36px",
					width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
				}}
			>
				{/* Header */}
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
					<div>
						<div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
							Transaction Record
						</div>
						<h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Payment Details</h2>
					</div>
					<button
						onClick={onClose}
						style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
					>
						×
					</button>
				</div>

				{/* Amount Hero */}
				<div
					style={{
						background: "linear-gradient(135deg, var(--brand-primary, #1b6348), #16a34a)",
						borderRadius: "16px", padding: "24px", marginBottom: "24px", color: "white", textAlign: "center",
					}}
				>
					<div style={{ fontSize: "0.8rem", opacity: 0.85, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
						Total Amount
					</div>
					<div style={{ fontSize: "2.5rem", fontWeight: 900 }}>
						{formatCurrency(payment.amount)}
					</div>
					<span
						style={{
							marginTop: "12px", display: "inline-block",
							background: payment.status === "paid" ? "rgba(255,255,255,0.2)" : "rgba(255,100,100,0.3)",
							border: "1px solid rgba(255,255,255,0.3)",
							borderRadius: "99px", padding: "4px 14px",
							fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
						}}
					>
						{payment.status || "pending"}
					</span>
				</div>

				{/* Details Grid */}
				<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					{[
						{ label: "Payment ID", value: payment._id || payment.referenceId || "—" },
						{
							label: "Payment Method",
							value: (
								<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
									{formatMethod(payment.method)}
								</span>
							),
						},
						{ label: "Date", value: formatDate(payment.paidAt || payment.createdAt) },
						{
							label: isDoctor ? "Patient" : "Doctor / Service",
							value: isDoctor
								? (payment.patient?.user?.name || "Private Patient")
								: (payment.doctorName || "General Consultation"),
						},
						payment.notes && { label: "Notes", value: payment.notes },
					]
						.filter(Boolean)
						.map(({ label, value }) => (
							<div
								key={label}
								style={{
									display: "flex", justifyContent: "space-between", alignItems: "center",
									padding: "14px 18px", background: "#f8fafc",
									borderRadius: "12px", fontSize: "0.9rem",
								}}
							>
								<span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
									{label}
								</span>
								<span style={{ fontWeight: 700, color: "var(--text-primary)", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>
									{value}
								</span>
							</div>
						))}
				</div>

				<button
					onClick={onClose}
					style={{
						width: "100%", marginTop: "24px", padding: "14px",
						background: "var(--brand-primary, #1b6348)", color: "white",
						border: "none", borderRadius: "12px", fontWeight: 700,
						fontSize: "0.95rem", cursor: "pointer",
					}}
				>
					Close
				</button>
			</div>
		</div>
	);
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Payments = () => {
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedPayment, setSelectedPayment] = useState(null);
	const itemsPerPage = 10;
	const { addToast } = useToast();
	const { user } = useAuth();
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");

	const loadPayments = async () => {
		setLoading(true);
		setError("");
		try {
			let data;
			if (user?.role === "admin") {
				const res = await api.get("/api/admin/payments");
				data = res.data;
			} else {
				data = await getMyPayments();
			}
			setPayments(Array.isArray(data) ? data : []);
		} catch (requestError) {
			const msg = requestError?.response?.data?.message || requestError?.message || "Failed to fetch payments.";
			addToast(msg, "error");
			setPayments([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadPayments();
	}, [user]);

	const summary = useMemo(() => {
		const paidTotal = payments
			.filter((item) => item?.status === "paid")
			.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

		const refundTotal = payments
			.filter((item) => item?.status === "refunded")
			.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

		const totalValue = paidTotal - refundTotal;

		const pendingTotal = payments
			.filter((item) => item?.status === "pending")
			.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

		return {
			totalValue,
			pendingTotal,
			pendingCount: payments.filter((item) => item?.status === "pending").length,
		};
	}, [payments]);

	const filteredPayments = useMemo(() => {
		if (!searchTerm.trim()) return payments;
		const term = searchTerm.toLowerCase();
		return payments.filter(p => 
			(p.patient?.user?.name || "").toLowerCase().includes(term) ||
			(p.doctorName || "").toLowerCase().includes(term) ||
			(p._id || "").toLowerCase().includes(term) ||
			(p.referenceId || "").toLowerCase().includes(term) ||
			(p.notes || "").toLowerCase().includes(term) ||
			String(p.amount).includes(term)
		);
	}, [payments, searchTerm]);

	const isDoctor = user?.role === "doctor";
	const isAdmin = user?.role === "admin";

	return (
		<>
			{selectedPayment && (
				<PaymentDetailModal
					payment={selectedPayment}
					onClose={() => setSelectedPayment(null)}
					isDoctor={isDoctor}
				/>
			)}

			<div className={styles.header}>
				<div>
					<h1 className={styles.headerTitle}>Payment History</h1>
					<p className={styles.headerSubtitle}>Manage your clinical billing and transaction records.</p>
				</div>
				<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
					<input 
						type="text" 
						placeholder="Search transactions..." 
						className={styles.searchInput}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							padding: "10px 16px",
							borderRadius: "12px",
							border: "1px solid var(--border-color)",
							fontSize: "0.9rem",
							width: "260px",
							outline: "none"
						}}
					/>
					<button className={styles.btnPrimary} onClick={loadPayments}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
						Refresh Data
					</button>
				</div>
			</div>

			<div className={styles.summaryGrid}>
				<div className={styles.summaryCard}>
					<div className={styles.summaryLabel}>{isAdmin ? "SYSTEM REVENUE" : isDoctor ? "TOTAL EARNINGS" : "TOTAL SPENT"}</div>
					<div className={styles.summaryValue}>{formatCurrency(summary.totalValue)}</div>

					<div className={styles.iconWrapper}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
					</div>
				</div>

				<div className={styles.summaryCard}>
					<div className={styles.summaryLabel}>PENDING PAYMENTS</div>
					<div className={styles.summaryValue}>{formatCurrency(summary.pendingTotal)}</div>
					<div className={styles.summarySub}>
						{summary.pendingCount} active {isDoctor ? "payouts" : "invoices"} require attention
					</div>
					<div className={styles.iconWrapper} style={{ background: "var(--input-bg)", color: "var(--brand-primary)" }}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><circle cx="12" cy="13" r="2" /><path d="M12 15v2" /></svg>
					</div>
				</div>

				{!isAdmin && (
					<div className={styles.summaryCard} style={{ border: '2px solid var(--brand-primary)' }}>
						<div className={styles.summaryLabel}>WALLET BALANCE</div>
						<div className={styles.summaryValue} style={{ color: 'var(--brand-primary)' }}>{formatCurrency(user?.walletBalance || 0)}</div>
						<div className={styles.summarySub}>Available for future bookings</div>
						<div className={styles.iconWrapper} style={{ background: '#dcf1e7', color: 'var(--brand-primary)' }}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>
						</div>
					</div>
				)}
			</div>

			<div className={styles.tableSection}>
				<div className={styles.tableHeader}>
					<h2 className={styles.tableTitle}>Recent Transactions</h2>
					<div className={styles.tableActions}></div>
				</div>

				<table className={styles.table}>
					<thead>
						<tr>
							<th>DATE</th>
							<th>{isDoctor ? "PATIENT & SERVICE" : "DOCTOR & SPECIALTY"}</th>
							<th>TYPE</th>
							<th>AMOUNT</th>
							<th>PAYMENT METHOD</th>
							<th>STATUS</th>
							<th>ACTION</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>Loading payments...</td>
							</tr>
						) : null}
						{!loading && filteredPayments.length === 0 ? (
							<tr>
								<td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
									No transactions found matching your search.
								</td>
							</tr>
						) : null}
						{filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((payment) => (
							<tr key={payment._id}>
								<td>
									<div className={styles.dateCell}>{formatDate(payment.paidAt || payment.createdAt)}</div>
									<div className={styles.idText}>ID: {payment.referenceId || payment._id}</div>
								</td>
								<td>
									<div className={styles.doctorCell}>
										<div className={styles.doctorIcon}>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
										</div>
										<div>
											<div className={styles.doctorName}>
												{isDoctor
													? (payment.patient?.user?.name || "Private Patient")
													: (payment.doctorName || "General Consultation")}
											</div>
											<div className={styles.doctorSpec}>
												{isDoctor
													? (payment.notes || "Medical Consultation")
													: (payment.specialty || "Healthcare Service")}
											</div>
										</div>
									</div>
								</td>
								<td>
									<span style={{ 
										fontSize: '0.75rem', 
										fontWeight: 700, 
										padding: '4px 8px', 
										borderRadius: '4px',
										background: payment.transactionType === 'credit' ? '#dcf1e7' : '#f1f5f9',
										color: payment.transactionType === 'credit' ? '#15803d' : '#64748b',
										textTransform: 'uppercase'
									}}>
										{payment.type === 'refund' ? 'REFUND' : (payment.transactionType || 'debit')}
									</span>
								</td>
								<td>
									<div className={styles.amount} style={{ color: payment.transactionType === 'credit' ? '#15803d' : 'inherit' }}>
										{payment.transactionType === 'credit' ? '+' : '-'}{formatCurrency(payment.amount)}
									</div>
								</td>
								<td>
									<div className={styles.methodCell}>
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
										{formatMethod(payment.method)}
									</div>
								</td>
								<td>
									<span className={`${styles.statusPill} ${STATUS_CLASS[payment.status] || styles.statusPending}`}>
										{String(payment.status || "pending").toUpperCase()}
									</span>
								</td>
								<td>
									<button
										className={styles.actionLink}
										style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", color: "var(--brand-primary)", fontWeight: 700 }}
										onClick={() => setSelectedPayment(payment)}
									>
										View Details
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<div className={styles.tableFooter}>
					<div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
						Showing {filteredPayments.length} transaction{filteredPayments.length === 1 ? "" : "s"}
					</div>
					<Pagination
						currentPage={currentPage}
						totalPages={Math.ceil(filteredPayments.length / itemsPerPage)}
						onPageChange={setCurrentPage}
					/>
				</div>
			</div>
		</>
	);
};

export default Payments;
