// Prescription controller: create and retrieve prescriptions tied to appointments.
const Prescription = require('../models/prescription.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');

exports.createPrescription = async (req, res) => {
	try {
		const { appointmentId, medications, advice, notes } = req.body;

		const appointment = await Appointment.findById(appointmentId);
		if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile || appointment.doctor.toString() !== doctorProfile._id.toString()) {
			return res.status(403).json({ message: 'Not authorized' });
		}

		const prescription = await Prescription.create({
			appointment: appointmentId,
			doctor: doctorProfile._id,
			patient: appointment.patient,
			medications,
			advice,
			notes
		});

		appointment.status = 'completed';
		await appointment.save();

		res.status(201).json(prescription);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getMyPrescriptions = async (req, res) => {
	try {
		const patientProfile = await Patient.findOne({ user: req.user._id });
		if (!patientProfile) return res.json([]);

		const prescriptions = await Prescription.find({ patient: patientProfile._id })
			.populate('doctor', 'user')
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization' } })
			.sort({ createdAt: -1 });

		res.json(prescriptions);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getDoctorPrescriptions = async (req, res) => {
	try {
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.json([]);

		const prescriptions = await Prescription.find({ doctor: doctorProfile._id })
			.populate('patient', 'user')
			.populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
			.sort({ createdAt: -1 });

		res.json(prescriptions);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getPrescriptionById = async (req, res) => {
	try {
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
