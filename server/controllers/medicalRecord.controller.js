// Medical Record controller: create, list, update, delete medical records and uploads.
const MedicalRecord = require('../models/medicalRecord.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const validators = require('../utils/validators');
const { createNotification } = require('../services/notification.service');

// Helper: Sanitizes pagination parameters (page, limit, skip)
const defaultSanitizePagination = (query = {}, defaults = { page: 1, limit: 10 }) => {
	const fallbackPage = Number(defaults.page) > 0 ? Number(defaults.page) : 1;
	const fallbackLimit = Number(defaults.limit) > 0 ? Number(defaults.limit) : 10;

	const parsedPage = Number.parseInt(query.page, 10);
	const parsedLimit = Number.parseInt(query.limit, 10);

	const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : fallbackPage;
	const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
		? Math.min(parsedLimit, 100)
		: fallbackLimit;

	return {
		page,
		limit,
		skip: (page - 1) * limit,
	};
};

const sanitizePagination =
	typeof validators?.sanitizePagination === 'function'
		? validators.sanitizePagination
		: defaultSanitizePagination;

// Helper: Normalizes MongoDB ObjectId to string
const normalizeId = (value) => {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (value._id) return String(value._id);
	return String(value);
};

// Helper: Inspects model reference schema path
const getAppointmentRef = (pathName) => {
	const schemaPath = Appointment.schema.path(pathName);
	return schemaPath?.options?.ref;
};

// Helper: Formats appointment date string for notification messages
const getAppointmentDisplayDate = (appointment) => {
	if (appointment?.scheduledAt) {
		const date = new Date(appointment.scheduledAt);
		if (!Number.isNaN(date.getTime())) {
			return date.toLocaleString();
		}
	}

	if (appointment?.date && appointment?.time) {
		return `${appointment.date} ${appointment.time}`;
	}

	if (appointment?.date) {
		return appointment.date;
	}

	return 'the selected date';
};

// Helper: Finds or creates a Patient document for a user
const getOrCreatePatientFromUser = async (userId) => {
	let patient = await Patient.findOne({ user: userId });
	if (!patient) {
		patient = await Patient.create({ user: userId });
	}
	return patient;
};

// ================= CREATE MEDICAL RECORD =================
// Logic: Validates doctor ownership, ensures completed appointment status, creates record, and notifies patient
const createMedicalRecord = async (req, res) => {
	try {
		// 1. Extract clinical details
		const {
			appointmentId,
			title,
			diagnosis,
			symptoms,
			medications,
			testsRecommended,
			notes,
			attachments,
		} = req.body;

		// 2. Validate mandatory fields
		if (!appointmentId || !title) {
			return res.status(400).json({ message: 'appointmentId and title are required' });
		}

		// 3. Find doctor profile
		const doctor = await Doctor.findOne({ user: req.user._id });
		if (!doctor) {
			return res.status(404).json({ message: 'Doctor profile not found' });
		}

		// 4. Fetch appointment and verify ownership
		const patientRef = getAppointmentRef('patient');
		const doctorRef = getAppointmentRef('doctor');

		let appointmentQuery = Appointment.findById(appointmentId);
		if (patientRef === 'Patient') {
			appointmentQuery = appointmentQuery.populate({
				path: 'patient',
				populate: { path: 'user', select: '_id name email' },
			});
		} else {
			appointmentQuery = appointmentQuery.populate({ path: 'patient', select: '_id name email' });
		}

		if (doctorRef === 'Doctor') {
			appointmentQuery = appointmentQuery.populate({
				path: 'doctor',
				populate: { path: 'user', select: '_id name email' },
			});
		} else {
			appointmentQuery = appointmentQuery.populate({ path: 'doctor', select: '_id name email' });
		}

		const appointment = await appointmentQuery;

		if (!appointment) {
			return res.status(404).json({ message: 'Appointment not found' });
		}

		const appointmentDoctorId = normalizeId(appointment.doctor);
		const isDoctorByProfile = appointmentDoctorId === String(doctor._id);
		const isDoctorByUser =
			appointmentDoctorId === String(req.user._id) ||
			appointmentDoctorId === String(doctor.user);

		if (!isDoctorByProfile && !isDoctorByUser) {
			return res
				.status(403)
				.json({ message: 'You can only create records for your own appointments' });
		}

		// 5. Ensure medical record is linked to a completed appointment
		const statusEnum = Appointment.schema.path('status')?.enumValues || [];
		const supportsCompleted = statusEnum.includes('completed');

		if (supportsCompleted && appointment.status !== 'completed') {
			return res.status(400).json({
				message: 'Medical records can only be created for completed appointments',
			});
		}

		if (!supportsCompleted && appointment.status === 'cancelled') {
			return res.status(400).json({
				message: 'Medical records cannot be created for cancelled appointments',
			});
		}

		// 6. Resolve patient profile
		let patientProfile;
		let patientUserId;

		if (patientRef === 'Patient') {
			patientProfile = appointment.patient;
			patientUserId = normalizeId(appointment?.patient?.user);
		} else {
			patientUserId = normalizeId(appointment.patient);
			if (!patientUserId) {
				return res.status(400).json({ message: 'Invalid appointment patient reference' });
			}
			patientProfile = await getOrCreatePatientFromUser(patientUserId);
		}

		if (!patientProfile?._id) {
			return res.status(404).json({ message: 'Patient profile not found' });
		}

		// 7. Save new MedicalRecord document
		const record = await MedicalRecord.create({
			patient: patientProfile._id,
			doctor: doctor._id,
			appointment: appointment._id,
			title,
			diagnosis: diagnosis || '',
			symptoms: Array.isArray(symptoms) ? symptoms : [],
			medications: Array.isArray(medications) ? medications : [],
			testsRecommended: Array.isArray(testsRecommended) ? testsRecommended : [],
			notes: notes || '',
			attachments: Array.isArray(attachments) ? attachments : [],
		});

		// 8. Send notification to patient
		await createNotification({
			recipient: patientUserId,
			title: 'New Medical Record',
			message: `A new medical record has been added for your appointment on ${getAppointmentDisplayDate(appointment)}`,
			type: 'appointment',
			data: { recordId: record._id, appointmentId: appointment._id }
		});

		const populated = await MedicalRecord.findById(record._id)
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
			.populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
			.populate('appointment');

		return res.status(201).json(populated);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= GET MY MEDICAL RECORDS (PATIENT) =================
// Logic: Retrieves paginated medical records for authenticated patient with optional keyword search
const getMyMedicalRecords = async (req, res) => {
	try {
		// 1. Get patient profile
		const patient = await Patient.findOne({ user: req.user._id });
		if (!patient) {
			return res.status(404).json({ message: 'Patient profile not found' });
		}

		// 2. Parse pagination and search filter
		const { page, limit, skip } = sanitizePagination(req.query, { page: 1, limit: 10 });
		const { search } = req.query;

		const filter = { patient: patient._id };
		if (search) {
			filter.$or = [
				{ title: { $regex: String(search), $options: 'i' } },
				{ diagnosis: { $regex: String(search), $options: 'i' } },
			];
		}

		// 3. Query paginated records
		const [records, total] = await Promise.all([
			MedicalRecord.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
				.populate('appointment'),
			MedicalRecord.countDocuments(filter),
		]);

		return res.status(200).json({ total, page, limit, data: records });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= GET DOCTOR PATIENT RECORDS =================
// Logic: Retrieves medical records authored by doctor, with optional patientId and search filter
const getDoctorPatientRecords = async (req, res) => {
	try {
		// 1. Get doctor profile
		const doctor = await Doctor.findOne({ user: req.user._id });
		if (!doctor) {
			return res.status(404).json({ message: 'Doctor profile not found' });
		}

		// 2. Parse pagination and filters
		const { page, limit, skip } = sanitizePagination(req.query, { page: 1, limit: 10 });
		const { patientId, search } = req.query;

		const filter = { doctor: doctor._id };
		if (patientId) filter.patient = patientId;
		if (search) {
			filter.$or = [
				{ title: { $regex: String(search), $options: 'i' } },
				{ diagnosis: { $regex: String(search), $options: 'i' } },
			];
		}

		// 3. Query records
		const [records, total] = await Promise.all([
			MedicalRecord.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
				.populate('appointment'),
			MedicalRecord.countDocuments(filter),
		]);

		return res.status(200).json({ total, page, limit, data: records });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= UPDATE MEDICAL RECORD =================
// Logic: Verifies doctor ownership, updates clinical fields, and notifies patient of changes
const updateMedicalRecord = async (req, res) => {
	try {
		// 1. Find doctor profile
		const doctor = await Doctor.findOne({ user: req.user._id });
		if (!doctor) {
			return res.status(404).json({ message: 'Doctor profile not found' });
		}

		// 2. Find record and verify doctor ownership
		const record = await MedicalRecord.findById(req.params.id).populate({
			path: 'patient',
			populate: { path: 'user', select: '_id' },
		});

		if (!record) {
			return res.status(404).json({ message: 'Medical record not found' });
		}

		if (record.doctor.toString() !== doctor._id.toString()) {
			return res.status(403).json({ message: 'You can update only your own medical records' });
		}

		// 3. Update permitted clinical fields
		const allowedFields = [
			'title',
			'diagnosis',
			'symptoms',
			'medications',
			'testsRecommended',
			'notes',
			'attachments',
		];

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				record[field] = req.body[field];
			}
		}

		await record.save();

		// 4. Notify patient
		await createNotification({
			recipient: record.patient?.user?._id,
			title: 'Medical Record Updated',
			message: 'One of your medical records has been updated by the doctor.',
			type: 'appointment',
			data: { recordId: record._id }
		});

		return res.status(200).json({ message: 'Medical record updated', record });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= DELETE MEDICAL RECORD =================
// Logic: Verifies doctor ownership or admin rights, then deletes record
const deleteMedicalRecord = async (req, res) => {
	try {
		// 1. Find record
		const record = await MedicalRecord.findById(req.params.id);
		if (!record) {
			return res.status(404).json({ message: 'Medical record not found' });
		}

		// 2. Check authorization
		if (req.user.role === 'doctor') {
			const doctor = await Doctor.findOne({ user: req.user._id });
			if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
				return res.status(403).json({ message: 'You can delete only your own medical records' });
			}
		}

		// 3. Remove record
		await record.deleteOne();
		return res.status(200).json({ message: 'Medical record deleted' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// ================= PATIENT UPLOAD RECORD =================
// Logic: Handles direct patient file upload (Cloudinary attachment), initializes patient profile if missing, and saves record
const patientUploadRecord = async (req, res) => {
	try {
		// 1. Validate file upload and title
		if (!req.file) {
			return res.status(400).json({ message: 'No file uploaded' });
		}

		const { title, notes } = req.body;
		if (!title) {
			return res.status(400).json({ message: 'Title is required for the record' });
		}

		// 2. Find or initialize patient profile
		const patient = await Patient.findOneAndUpdate(
			{ user: req.user._id },
			{ $setOnInsert: { user: req.user._id } },
			{ returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
		);

		if (!patient) {
			return res.status(404).json({ message: 'Patient profile could not be initialized' });
		}

		const filePath = req.file.path; // Cloudinary secure URL
		
		// 3. Create medical record with attachment
		const record = await MedicalRecord.create({
			patient: patient._id,
			title,
			notes: notes || '',
			attachments: [filePath],
		});

		res.status(201).json({
			message: 'Medical record uploaded successfully',
			record
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	createMedicalRecord,
	getMyMedicalRecords,
	getDoctorPatientRecords,
	updateMedicalRecord,
	deleteMedicalRecord,
	patientUploadRecord,
};

