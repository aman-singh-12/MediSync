// Patient controller: patient profiles, saved doctors, dashboard and patient helpers.
const mongoose = require('mongoose');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const MedicalRecord = require('../models/medicalRecord.model');
const User = require('../models/user.model');
const Payment = require('../models/payment.model');

// Helper: Configures dynamic populate settings for Doctor model reference in appointments
const getAppointmentDoctorPopulate = () => {
	const doctorPath = Appointment.schema.path('doctor');
	const doctorRef = doctorPath?.options?.ref;

	if (doctorRef === 'Doctor') {
		return {
			path: 'doctor',
			populate: { path: 'user', select: 'name email' },
		};
	}

	return { path: 'doctor', select: 'name email' };
};

// Helper: Configures dynamic populate settings for Doctor in medical records
const getMedicalRecordDoctorPopulate = () => {
	const doctorPath = MedicalRecord.schema.path('doctor');
	const doctorRef = doctorPath?.options?.ref;

	if (doctorRef === 'Doctor') {
		return {
			path: 'doctor',
			populate: { path: 'user', select: 'name email' },
		};
	}

	return { path: 'doctor', select: 'name email' };
};

// Helper: Parses value to valid JavaScript Date object
const toValidDate = (value) => {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Helper: Normalizes appointment timestamp for chronological sorting
const getAppointmentDate = (appointment) => {
	if (appointment?.scheduledAt) {
		const scheduledAt = toValidDate(appointment.scheduledAt);
		if (scheduledAt) return scheduledAt;
	}

	if (appointment?.date && appointment?.time) {
		const withTime = toValidDate(`${appointment.date} ${appointment.time}`);
		if (withTime) return withTime;
	}

	if (appointment?.date) {
		const dateOnly = toValidDate(appointment.date);
		if (dateOnly) return dateOnly;
	}

	if (appointment?.createdAt) {
		const createdAt = toValidDate(appointment.createdAt);
		if (createdAt) return createdAt;
	}

	if (appointment?._id && typeof appointment._id.getTimestamp === 'function') {
		return appointment._id.getTimestamp();
	}

	return new Date(0);
};

// Helper: Finds existing Patient document or initializes one for the user
const getOrCreatePatient = async (userId) => {
	const patient = await Patient.findOneAndUpdate(
		{ user: userId },
		{ $setOnInsert: { user: userId } },
		{ returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
	);

	return patient;
};

// ================= GET SAVED DOCTORS =================
// Logic: Retrieves list of bookmarked/favorite doctors saved by the logged-in patient
const getSavedDoctors = async (req, res) => {
	try {
		// 1. Fetch user's saved doctors with populated profile info
		const user = await User.findById(req.user._id).populate({ path: 'savedDoctors', populate: { path: 'user', select: 'name email' } }).lean();
		return res.status(200).json(user?.savedDoctors || []);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= ADD SAVED DOCTOR =================
// Logic: Bookmarks a doctor to user's savedDoctors array, preventing duplicate entries
const addSavedDoctor = async (req, res) => {
	try {
		// 1. Validate doctor existence
		const doctorId = req.params.doctorId;
		if (!doctorId) return res.status(400).json({ message: 'Doctor id required' });

		const doctor = await Doctor.findById(doctorId).lean();
		if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

		// 2. Append doctor ID if not already bookmarked
		const user = await User.findById(req.user._id);
		if (!user.savedDoctors) user.savedDoctors = [];
		if (!user.savedDoctors.find((d) => d.toString() === doctorId.toString())) {
			user.savedDoctors.push(doctorId);
			await user.save();
		}

		return res.status(200).json({ message: 'Doctor saved', savedDoctorsCount: user.savedDoctors.length });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= REMOVE SAVED DOCTOR =================
// Logic: Removes a doctor from the user's bookmarked savedDoctors list
const removeSavedDoctor = async (req, res) => {
	try {
		// 1. Extract doctor ID and filter out from saved list
		const doctorId = req.params.doctorId;
		if (!doctorId) return res.status(400).json({ message: 'Doctor id required' });

		const user = await User.findById(req.user._id);
		if (!user || !user.savedDoctors) return res.status(200).json({ message: 'No saved doctors', savedDoctorsCount: 0 });

		user.savedDoctors = user.savedDoctors.filter((d) => d.toString() !== doctorId.toString());
		await user.save();

		return res.status(200).json({ message: 'Doctor removed', savedDoctorsCount: user.savedDoctors.length });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= GET MY PATIENT PROFILE =================
// Logic: Retrieves profile data (blood group, allergies, emergency contacts) for authenticated patient
const getMyPatientProfile = async (req, res) => {
	try {
		// 1. Find or initialize patient record
		const patient = await getOrCreatePatient(req.user._id);
		const populated = await Patient.findById(patient._id).populate('user', 'name email');
		return res.status(200).json(populated);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= UPSERT PATIENT PROFILE =================
// Logic: Updates or creates patient profile information and syncs User model name
const upsertPatientProfile = async (req, res) => {
	try {
		// 1. Filter allowed profile update keys
		const allowedFields = [
			'name',
			'phone',
			'gender',
			'dateOfBirth',
			'bloodGroup',
			'allergies',
			'chronicConditions',
			'emergencyContactName',
			'emergencyContactPhone',
			'address',
		];

		const updateData = {};
		for (const key of allowedFields) {
			if (req.body[key] !== undefined) {
				updateData[key] = req.body[key];
			}
		}

		// 2. Sync User model name if updated
		if (updateData.name) {
			await User.findByIdAndUpdate(req.user._id, { name: updateData.name });
			delete updateData.name;
		}

		// 3. Upsert patient record
		const patient = await Patient.findOneAndUpdate(
			{ user: req.user._id },
			{ $set: updateData, $setOnInsert: { user: req.user._id } },
			{ returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
		).populate('user', 'name email');

		return res.status(200).json({ message: 'Patient profile updated', patient });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= GET PATIENT DASHBOARD =================
// Logic: Aggregates patient dashboard metrics: appointments, recent medical records, payments, and spending
const getPatientDashboard = async (req, res) => {
	try {
		// 1. Resolve patient ID references
		const patient = await getOrCreatePatient(req.user._id);
		const now = new Date();
		const todayStr = now.toISOString().split('T')[0];
		const patientRefs = [req.user._id, patient._id];

		// 2. Concurrently query appointments, records, user profile, and payment history
		const [appointments, recentRecords, totalRecordsCount, user, recentPayments, paymentsAgg] = await Promise.all([
			Appointment.find({ patient: { $in: patientRefs } })
				.populate(getAppointmentDoctorPopulate())
				.lean(),
			MedicalRecord.find({ patient: { $in: patientRefs } })
				.sort({ createdAt: -1 })
				.limit(5)
				.populate(getMedicalRecordDoctorPopulate())
				.lean(),
			MedicalRecord.countDocuments({ patient: { $in: patientRefs } }),
			User.findById(req.user._id).lean(),
			Payment.find({ $or: [{ patient: { $in: patientRefs } }, { user: { $in: patientRefs } }] })
				.sort({ createdAt: -1 })
				.limit(5)
				.lean(),
			Payment.aggregate([
				{ $match: { $or: [{ patient: { $in: patientRefs } }, { user: { $in: patientRefs } }], status: 'paid' } },
				{ $group: { _id: null, total: { $sum: '$amount' } } },
			]),
		]);

		// 3. Calculate appointment breakdown metrics
		const totalAppointments = appointments.length;
		const completedAppointments = appointments.filter(
			(item) => item.status === 'completed'
		).length;
		const upcomingAppointments = appointments.filter((item) => {
			const status = item.status || 'booked';
			if (!['booked', 'confirmed', 'rescheduled'].includes(status)) return false;

			const scheduledTime = getAppointmentDate(item);
			return scheduledTime >= now;
		}).length;

		// 4. Filter today's scheduled consultations
		const todayAppointments = appointments.filter((item) => {
			const status = item.status || 'booked';
			if (status === 'cancelled') return false;
			return item.date === todayStr;
		}).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

		// 5. Select 5 most recent appointments
		const recentAppointments = [...appointments]
			.sort((a, b) => getAppointmentDate(b) - getAppointmentDate(a))
			.slice(0, 5);

		// 6. Calculate unread notifications and total payments
		const unreadNotifications = user?.notifications?.filter((item) => !item.isRead).length || 0;
		const totalSpent = (paymentsAgg && paymentsAgg[0] && paymentsAgg[0].total) ? paymentsAgg[0].total : 0;
		const savedDoctorsCount = (user?.savedDoctors && Array.isArray(user.savedDoctors)) ? user.savedDoctors.length : 0;

		// 7. Return combined dashboard summary
		return res.status(200).json({
			appointmentStats: {
				total: totalAppointments,
				upcoming: upcomingAppointments,
				completed: completedAppointments,
			},
			recordsCount: totalRecordsCount,
			unreadNotifications,
			totalSpent,
			savedDoctorsCount,
			recentAppointments,
			todayAppointments,
			recentRecords,
			recentPayments,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getSavedDoctors,
	addSavedDoctor,
	removeSavedDoctor,
	getMyPatientProfile,
	upsertPatientProfile,
	getPatientDashboard,
};

