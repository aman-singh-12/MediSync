// Doctor controller: manage doctor profiles, availability, stats, and related data.
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');
const PendingUser = require('../models/pendingUser.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const MedicalRecord = require('../models/medicalRecord.model');
const Patient = require('../models/patient.model');
const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');





// ================= GET ALL DOCTORS =================
// Logic: Checks Redis cache, builds dynamic filter query (specialization, fee, hospital, keyword), fetches approved doctors, and caches result
const getAllDoctors = async (req, res) => {
	try {
		// 1. Extract query filter parameters
		const { specialization, hospital, minFee, maxFee, search } = req.query;

		// 2. Check Redis cache for existing results
		const cacheKey = `doctors:${JSON.stringify(req.query || {})}`;
		try {
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				console.log('Cache hit for getAllDoctors');
				return res.json(JSON.parse(cachedData));
			}
			console.log('Cache miss for getAllDoctors');
		} catch (err) {
			console.error('Redis get error:', err);
		}

		// 3. Build MongoDB query for approved doctors
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

		// 4. Query database and populate user profile info
		const doctors = await Doctor.find(query)
			.populate('user', 'name email role profilePicture')
			.lean();
			
		// 5. Store fetched list in Redis cache (1 hour TTL)
		try {
			await redisClient.setEx(cacheKey, 3600, JSON.stringify(doctors));
		} catch (err) {
			console.error('Redis setEx error:', err);
		}

		// 6. Return response
		res.json(doctors);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};







// ================= GET DOCTOR BY ID =================
// Logic: Checks Redis cache, finds single approved doctor by ID, populates user details, and caches result
const getDoctorById = async (req, res) => {
	try {
		// 1. Extract doctor ID and check cache
		const doctorId = req.params.id;
		const cacheKey = `doctor:${doctorId}`;

		try {
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				console.log(`Cache hit for getDoctorById: ${doctorId}`);
				return res.json(JSON.parse(cachedData));
			}
			console.log(`Cache miss for getDoctorById: ${doctorId}`);
		} catch (err) {
			console.error('Redis get error:', err);
		}

		// 2. Fetch doctor from database with populated user details
		const doctor = await Doctor.findById(doctorId).populate('user', 'name email role profilePicture');

		// 3. Ensure doctor exists and is approved by admin
		if (!doctor || !doctor.isApproved) {
			return res.status(404).json({ message: 'Doctor not found or not approved' });
		}

		// 4. Cache doctor profile in Redis (1 hour TTL)
		try {
			await redisClient.setEx(cacheKey, 3600, JSON.stringify(doctor));
		} catch (err) {
			console.error('Redis setEx error:', err);
		}

		res.json(doctor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};










// ================= GET MY DOCTOR PROFILE =================
// Logic: Finds doctor profile for authenticated user, auto-creating a draft if newly registered
const getMyDoctorProfile = async (req, res) => {
	try {
		// 1. Find doctor profile for logged-in user
		let doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email role profilePicture');

		// 2. If no profile exists yet, auto-create default unapproved profile
		if (!doctor) {
			doctor = await Doctor.create({ 
				user: req.user._id,
				specialization: 'General Practice',
				isApproved: false // Requires admin approval
			});
			doctor = await doctor.populate('user', 'name email role profilePicture');
		}

		res.json(doctor);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ================= UPSERT DOCTOR PROFILE =================
// Logic: Updates or creates doctor details (fees, hospital, bio, slots) and syncs user name
const upsertDoctorProfile = async (req, res) => {
	try {
		// 1. Extract profile attributes
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

		// 2. Validate mandatory fields
		if (!specialization) {
			return res.status(400).json({ message: 'Specialization is required' });
		}

		// 3. Sync User model name if updated
		if (name) {
			await User.findByIdAndUpdate(req.user._id, { name });
		}

		// 4. Upsert doctor record
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

// ================= DELETE DOCTOR PROFILE =================
// Logic: Verifies ownership or admin privileges, then deletes the doctor profile
const deleteDoctorProfile = async (req, res) => {
	try {
		// 1. Find doctor profile
		const doctor = await Doctor.findById(req.params.id);

		if (!doctor) {
			return res.status(404).json({ message: 'Doctor profile not found' });
		}

		// 2. Check authorization (profile owner or admin only)
		const isOwner = doctor.user.toString() === req.user._id.toString();
		const isAdmin = req.user.role === 'admin';

		if (!isOwner && !isAdmin) {
			return res.status(403).json({ message: 'Access denied' });
		}

		// 3. Remove document from database
		await doctor.deleteOne();
		res.json({ message: 'Doctor profile deleted' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};









// ================= GET DOCTOR STATS =================
// Logic: Computes dashboard statistics (today's appointments, total unique patients, total revenue, pending approvals)
const getDoctorStats = async (req, res) => {
	try {
		// 1. Get doctor profile
		let doctorProfile = await Doctor.findOne({ user: req.user._id });

		if (!doctorProfile) {
			doctorProfile = await Doctor.create({ 
				user: req.user._id,
				specialization: 'General Practice',
				isApproved: false
			});
		}

		const doctorId = doctorProfile._id;
		const today = new Date().toLocaleDateString('en-CA');

		// 2. Count appointments scheduled for today
		const todaysAppointments = await Appointment.countDocuments({ 
			doctor: doctorId, 
			date: today,
			status: { $ne: 'cancelled' }
		});

		// 3. Count unique patients treated
		const patients = await Appointment.distinct('patient', { doctor: doctorId });
		const totalPatients = patients.length;

		// 4. Aggregate total earnings from paid appointment payments
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

		// 5. Check pending approvals for admin context
		let pendingApprovals = 0;
		if (req.user.role === 'admin') {
			pendingApprovals = await PendingUser.countDocuments();
		}

		// 6. Return combined stats object
		res.json({ todaysAppointments, totalPatients, totalEarnings, pendingApprovals });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};








// ================= GET MY REVIEWS =================
// Logic: Retrieves paginated patient reviews and ratings for the authenticated doctor
const getMyReviews = async (req, res) => {
	try {
		// 1. Parse pagination parameters
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// 2. Count total reviews and query paginated review records
		const total = await Review.countDocuments({ doctor: req.user._id });
		const reviews = await Review.find({ doctor: req.user._id })
			.populate('patient', 'name profilePicture')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		// 3. Return reviews with pagination metadata
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












// ================= ADD AVAILABLE SLOT =================
// Logic: Splits start to end time into 15-minute intervals, avoids duplicate slots, and saves them
const addAvailableSlot = async (req, res) => {
	try {
    // 1. Extract inputs and find doctor profile
    const { day, startTime, endTime } = req.body;
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });
    
    // 2. Helper: Split time interval into 15-minute booking slots
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

    // 3. Filter out duplicate slots already saved for this day
    const filteredNewSlots = newSlots.filter(ns => 
      !doctorProfile.availableSlots.some(s => s.day === ns.day && s.startTime === ns.startTime)
    );

    if (filteredNewSlots.length === 0) {
      return res.status(400).json({ message: 'All slots in this range already exist.' });
    }

    // 4. Save new slots to doctor profile
    doctorProfile.availableSlots.push(...filteredNewSlots);
    await doctorProfile.save();
    res.status(201).json(doctorProfile.availableSlots);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};










// ================= DELETE AVAILABLE SLOT =================
// Logic: Removes a specific availability slot from the doctor profile by slot ID
const deleteAvailableSlot = async (req, res) => {
	try {
		// 1. Find doctor profile
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

		// 2. Remove specified slot by ID
		doctorProfile.availableSlots = doctorProfile.availableSlots.filter(
			slot => slot._id.toString() !== req.params.slotId
		);
		await doctorProfile.save();
		res.json(doctorProfile.availableSlots);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};












// ================= GET MY PATIENTS =================
// Logic: Finds unique patients who have booked appointments with this doctor, supports search and pagination
const getMyPatients = async (req, res) => {
	try {
		// 1. Find doctor profile
		const doctorProfile = await Doctor.findOne({ user: req.user._id });
		if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

		// 2. Parse pagination
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// 3. Get unique patient IDs from appointments
		const patientIds = await Appointment.find({ doctor: doctorProfile._id }).distinct('patient');
		const query = { _id: { $in: patientIds } };

		// 4. Apply name search filter if provided
		if (req.query.search) {
			const matchingUsers = await User.find({
				name: { $regex: req.query.search, $options: 'i' }
			}).distinct('_id');
			query.user = { $in: matchingUsers };
		}

		// 5. Query paginated patients
		const total = await Patient.countDocuments(query);
		const patients = await Patient.find(query)
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











// ================= GET PATIENT MEDICAL RECORDS =================
// Logic: Retrieves all medical record history for a patient, populated with doctor names
const getPatientMedicalRecords = async (req, res) => {
	try {
		// 1. Query records by patient ID and populate doctor details
		const records = await MedicalRecord.find({ patient: req.params.patientId })
			.populate('doctor', 'user')
			.populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
			.sort({ createdAt: -1 });

		res.json(records);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};










// ================= GET AVAILABLE SLOTS BY DATE =================
// Logic: Looks up weekday slots for doctor and filters out slots already booked on that date
const getAvailableSlotsByDate = async (req, res) => {
	try {
		// 1. Extract doctor ID and requested date
		const { doctorId } = req.params;
		const { date } = req.query; // Format: YYYY-MM-DD

		if (!date) return res.status(400).json({ message: 'Date is required' });

		// 2. Find doctor and determine day of the week
		const doctor = await Doctor.findById(doctorId);
		if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const d = new Date(date);
		const dayOfWeek = days[d.getDay()];

		// 3. Filter doctor's general schedule for this weekday
		const daySlots = doctor.availableSlots.filter(s => s.day === dayOfWeek);

		// 4. Query active appointments already booked on this specific date
		const bookedAppointments = await Appointment.find({
			doctor: doctorId,
			date,
			status: { $nin: ['cancelled'] }
		}).select('time');

		const bookedTimes = bookedAppointments.map(a => a.time);

		// 5. Filter out occupied time slots
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

