// Review controller: create and fetch reviews for doctors.
const Review = require('../models/review.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');

// ================= ADD REVIEW =================
// Logic: Validates rating (1-5), verifies patient had a completed appointment with the doctor, prevents duplicates, and saves review
exports.addReview = async (req, res) => {
  try {
    // 1. Extract review payload
    const { doctorId, rating, comment } = req.body;

    // 2. Validate input constraints
    if (!doctorId || !rating) {
      return res.status(400).json({ message: 'Doctor ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // 3. Find patient profile for logged-in user
    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (!patientProfile) {
      return res.status(403).json({ message: 'Patient profile not found. Complete your profile first.' });
    }

    // 4. Resolve Doctor document
    const doctorProfile = await Doctor.findOne({ user: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    // 5. Verify patient had an appointment with this doctor before leaving review
    const appointment = await Appointment.findOne({
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      status: { $in: ['completed', 'confirmed'] }
    });

    if (!appointment) {
      return res.status(403).json({ message: 'You can only review doctors you have had a completed or confirmed appointment with' });
    }

    // 6. Prevent duplicate reviews by the same patient
    const existing = await Review.findOne({
      patient: req.user._id,
      doctor: doctorId,
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this doctor' });
    }

    // 7. Create review document
    const review = await Review.create({
      patient: req.user._id,
      doctor: doctorId,
      rating,
      comment,
    });

    const populated = await Review.findById(review._id).populate('patient', 'name email profilePicture');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET DOCTOR REVIEWS =================
// Logic: Retrieves all reviews submitted for a specific doctor, populated with patient names
exports.getDoctorReviews = async (req, res) => {
  try {
    // 1. Query reviews by doctor ID
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email');

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};