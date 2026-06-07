// Patient model: profile information linked to a `User` account.
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
			index: true,
		},
		phone: { type: String, trim: true, default: '' },
		gender: {
			type: String,
			enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
			default: '',
		},
		dateOfBirth: { type: Date },
		bloodGroup: { type: String, trim: true, default: '' },
		allergies: [{ type: String, trim: true }],
		chronicConditions: [{ type: String, trim: true }],
		emergencyContactName: { type: String, trim: true, default: '' },
		emergencyContactPhone: { type: String, trim: true, default: '' },
		address: { type: String, trim: true, default: '' },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
