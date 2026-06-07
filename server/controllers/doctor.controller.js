// Doctor controller: manage doctor profiles, availability, stats, and related data.
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');
const PendingUser = require('../models/pendingUser.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

const getAllDoctors = async (req, res) => {
	try {
		const { specialization, hospital, minFee, maxFee, search } = req.query;
		let query = { isApproved: true };

		if (specialization) {
			query.specialization = { $regex: specialization, $options: 'i' };
		}
		if (hospital) {
			query.hospital = { $regex: hospital, $options: 'i' };
		}
		if (minFee || maxFee) {
			query.consultationFee = {};
			if (minFee) query.consultationFee.$gte = Number(minFee);
			if (maxFee) query.consultationFee.$lte = Number(maxFee);
		}
		if (search) {
			query.$or = [
				{ specialization: { $regex: search, $options: 'i' } },
				{ hospital: { $regex: search, $options: 'i' } },
				{ bio: { $regex: search, $options: 'i' } },
			];
		}

		const doctors = await Doctor.find(query)
			.populate('user', 'name email role profilePicture')
			.lean();
		res.json(doctors);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getDoctorById = async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.id).populate('user', 'name email role profilePicture');

		if (!doctor || !doctor.isApproved) {
			return res.status(404).json({ message: 'Doctor not found or not approved' });
		}

		res.json(doctor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getMyDoctorProfile = async (req, res) => {
	try {
		let doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email role profilePicture');

		if (!doctor) {
			// Auto-create basic profile for newly registered doctors
			doctor = await Doctor.create({ 
				user: req.user._id,
				specialization: 'General Practice',
				isApproved: false // Still needs admin approval
			});
			doctor = await doctor.populate('user', 'name email role profilePicture');
		}

		res.json(doctor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const upsertDoctorProfile = async (req, res) => {
	try {
		const {
			name,
			specialization,
			qualification,
			experienceYears,
			consultationFee,
			hospital,
			bio,
			availableSlots,
		} = req.body;

		if (!specialization) {
			return res.status(400).json({ message: 'Specialization is required' });
		}

		// Update User name if provided
		if (name) {
			await User.findByIdAndUpdate(req.user._id, { name });
		}

		const payload = {
			user: req.user._id,
			specialization,
			qualification,
			experienceYears,
			consultationFee,
			hospital,
			bio,
			availableSlots,
		};

		const doctor = await Doctor.findOneAndUpdate(
			{ user: req.user._id },
			payload,
			{
				returnDocument: 'after',
				upsert: true,
				runValidators: true,
				setDefaultsOnInsert: true,
			}
		).populate('user', 'name email role profilePicture');

		res.status(200).json(doctor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteDoctorProfile = async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.id);

		if (!doctor) {
			return res.status(404).json({ message: 'Doctor profile not found' });
		}

		const isOwner = doctor.user.toString() === req.user._id.toString();
		const isAdmin = req.user.role === 'admin';

		if (!isOwner && !isAdmin) {
			return res.status(403).json({ message: 'Access denied' });
		}

		await doctor.deleteOne();
		res.json({ message: 'Doctor profile deleted' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getDoctorStats = async (req, res) => {
	try {
		let doctorProfile = await Doctor.findOne({ user: req.user._id });

		if (!doctorProfile) {
			// Auto-create basic profile
			doctorProfile = await Doctor.create({ 
				user: req.user._id,
				specialization: 'General Practice',
				isApproved: false
			});
		}

		const doctorId = doctorProfile._id;
		const today = new Date().toLocaleDateString('en-CA');

		const todaysAppointments = await Appointment.countDocuments({ 
			doctor: doctorId, 
			date: today,
			status: { $ne: 'cancelled' }
		});

		const patients = await Appointment.distinct('patient', { doctor: doctorId });
		const totalPatients = patients.length;

		const earningsAgg = await Appointment.aggregate([
			{ $match: { doctor: doctorId, status: { $ne: 'cancelled' } } },
			{
				$lookup: {
					from: 'payments',
					localField: '_id',
					foreignField: 'appointment',
					as: 'payments',
				},
			},
			{ $unwind: '$payments' },
			{ $match: { 'payments.status': 'paid' } },
			{ $group: { _id: null, total: { $sum: '$payments.amount' } } },
		]);

		const totalEarnings = (earningsAgg[0] && earningsAgg[0].total) || 0;

		let pendingApprovals = 0;
		if (req.user.role === 'admin') {
			pendingApprovals = await PendingUser.countDocuments();
		}

		res.json({ todaysAppointments, totalPatients, totalEarnings, pendingApprovals });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getMyReviews = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const total = await Review.countDocuments({ doctor: req.user._id });
		const reviews = await Review.find({ doctor: req.user._id })
			.populate('patient', 'name profilePicture')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		res.json({
			reviews,
			total,
			page,
			pages: Math.ceil(total / limit)
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Manage Availability Slots
const addAvailableSlot = async (req, res) => {
	try {
    const { day, startTime, endTime } = req.body;
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });
    
    // Function to generate 15-min slots
    const generateSlots = (start, end) => {
      const slots = [];
      let current = new Date(`2000-01-01T${start}:00`);
      const stop = new Date(`2000-01-01T${end}:00`);
      
      while (current < stop) {
        const next = new Date(current.getTime() + 15 * 60000);
        if (next > stop) break;
        
        const sTime = current.toTimeString().substring(0, 5);
        const eTime = next.toTimeString().substring(0, 5);
        
        slots.push({ day, startTime: sTime, endTime: eTime });
        current = next;
      }
      return slots;
    };

    const newSlots = generateSlots(startTime, endTime);
    
    if (newSlots.length === 0) {
      return res.status(400).json({ message: 'Invalid time range for slots.' });
    }

    // Filter out duplicates
    const filteredNewSlots = newSlots.filter(ns => 
      !doctorProfile.availableSlots.some(s => s.day === ns.day && s.startTime === ns.startTime)
    );

    if (filteredNewSlots.length === 0) {
      return res.status(400).json({ message: 'All slots in this range already exist.' });
    }

    doctorProfile.availableSlots.push(...filteredNewSlots);
    await doctorProfile.save();
    res.status(201).json(doctorProfile.availableSlots);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteAvailableSlot = async (req, res) => {
	try {
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

		doctorProfile.availableSlots = doctorProfile.availableSlots.filter(
			slot => slot._id.toString() !== req.params.slotId
		);
		await doctorProfile.save();
		res.json(doctorProfile.availableSlots);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getMyPatients = async (req, res) => {
	try {
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// Get unique patient IDs from appointments
		const appointmentModel = require('../models/appointment.model');
		const patientIds = await appointmentModel.find({ doctor: doctorProfile._id }).distinct('patient');

		const patientModel = require('../models/patient.model');
		const query = { _id: { $in: patientIds } };

		if (req.query.search) {
			const userModel = require('../models/user.model');
			const matchingUsers = await userModel.find({
				name: { $regex: req.query.search, $options: 'i' }
			}).distinct('_id');
			query.user = { $in: matchingUsers };
		}

		const total = await patientModel.countDocuments(query);
		const patients = await patientModel.find(query)
			.populate('user', 'name email profilePicture')
			.skip(skip)
			.limit(limit);

		res.json({
			patients,
			total,
			page,
			pages: Math.ceil(total / limit)
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};



const getPatientMedicalRecords = async (req, res) => {
	try {
		const MedicalRecord = require('../models/medicalRecord.model');
		const records = await MedicalRecord.find({ patient: req.params.patientId })
			.populate('doctor', 'user')
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
			.sort({ createdAt: -1 });
		res.json(records);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getAvailableSlotsByDate = async (req, res) => {
	try {
		const { doctorId } = req.params;
		const { date } = req.query; // YYYY-MM-DD

		if (!date) return res.status(400).json({ message: 'Date is required' });

		const doctor = await Doctor.findById(doctorId);
		if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const d = new Date(date);
		const dayOfWeek = days[d.getDay()];

		// Filter slots for that day
		const daySlots = doctor.availableSlots.filter(s => s.day === dayOfWeek);

		// Get already booked appointments for this doctor on this date
		const bookedAppointments = await Appointment.find({
			doctor: doctorId,
			date,
			status: { $nin: ['cancelled'] }
		}).select('time');

		const bookedTimes = bookedAppointments.map(a => a.time);

		// Filter out booked slots
		const availableSlots = daySlots.filter(s => !bookedTimes.includes(s.startTime));

		res.json(availableSlots);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllDoctors,
	getDoctorById,
	getMyDoctorProfile,
	upsertDoctorProfile,
	deleteDoctorProfile,
	getDoctorStats,
	getMyReviews,
	addAvailableSlot,
	deleteAvailableSlot,
	getMyPatients,
	getPatientMedicalRecords,
	getAvailableSlotsByDate,
};
