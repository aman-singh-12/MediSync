// Prescription controller: create and retrieve prescriptions tied to appointments.
const Prescription = require('../models/prescription.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');

// ================= CREATE PRESCRIPTION =================
// Logic: Validates doctor ownership, records medications & advice, and automatically marks appointment completed
exports.createPrescription = async (req, res) => {
	try {
		// 1. Extract prescription data
		const { appointmentId, medications, advice, notes } = req.body;

		// 2. Verify appointment existence
		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

		// 3. Verify doctor authorization
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile || appointment.doctor.toString() !== doctorProfile._id.toString()) {
			return res.status(403).json({ message: 'Not authorized' });
		}

		// 4. Create prescription document
		const prescription = await Prescription.create({
			appointment: appointmentId,
			doctor: doctorProfile._id,
			patient: appointment.patient,
			medications,
			advice,
			notes
		});

		// 5. Automatically mark appointment as completed
		appointment.status = 'completed';
		await appointment.save();

		res.status(201).json(prescription);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ================= GET MY PRESCRIPTIONS (PATIENT) =================
// Logic: Retrieves prescription history for authenticated patient, populated with doctor details
exports.getMyPrescriptions = async (req, res) => {
	try {
		// 1. Find patient profile
		const patientProfile = await Patient.findOne({ user: req.user._id });
		if (!patientProfile) return res.json([]);

		// 2. Fetch prescriptions sorted newest first
		const prescriptions = await Prescription.find({ patient: patientProfile._id })
			.populate('doctor', 'user')
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization' } })
			.sort({ createdAt: -1 });

		res.json(prescriptions);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ================= GET DOCTOR PRESCRIPTIONS =================
// Logic: Retrieves all prescriptions issued by the authenticated doctor
exports.getDoctorPrescriptions = async (req, res) => {
	try {
		// 1. Find doctor profile
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.json([]);

		// 2. Fetch prescriptions populated with patient names
		const prescriptions = await Prescription.find({ doctor: doctorProfile._id })
			.populate('patient', 'user')
			.populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
			.sort({ createdAt: -1 });

		res.json(prescriptions);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ================= GET PRESCRIPTION BY ID =================
// Logic: Retrieves single prescription details with populated doctor and patient info
exports.getPrescriptionById = async (req, res) => {
	try {
		// 1. Find prescription by ID
		const prescription = await Prescription.findById(req.params.id)
			.populate('doctor', 'user')
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization' } })
			.populate('patient', 'user')
			.populate({ path: 'patient', populate: { path: 'user', select: 'name' } });
		
		if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
		res.json(prescription);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

