// Prescription model: medications, advice, and notes linked to an appointment.
const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
	{
		appointment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Appointment',
			required: true,
		},
		doctor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Doctor',
			required: true,
		},
		patient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Patient',
			required: true,
		},
		medications: [
			{
				name: { type: String, required: true },
				dosage: { type: String, required: true },
				frequency: { type: String },
				duration: { type: String, required: true },
				instructions: { type: String },
			},
		],
		advice: { type: String },
		notes: { type: String },
		date: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
