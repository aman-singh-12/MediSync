// Review controller: create and fetch reviews for doctors.
const Review = require('../models/review.model');
const Patient = require('../models/patient.model');

exports.addReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;

    if (!doctorId || !rating) {
      return res.status(400).json({ message: 'Doctor ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the patient profile for the current user
    const Appointment = require('../models/appointment.model');
    const Doctor = require('../models/doctor.model');
    const patientProfile = await Patient.findOne({ user: req.user._id });
    
    if (!patientProfile) {
      return res.status(403).json({ message: 'Patient profile not found. Complete your profile first.' });
    }

    // Resolve the Doctor profile ID from the User ID
    const doctorProfile = await Doctor.findOne({ user: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    // Check if patient had an appointment with this doctor
    const appointment = await Appointment.findOne({
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      status: { $in: ['completed', 'confirmed'] }
    });

    if (!appointment) {
      return res.status(403).json({ message: 'You can only review doctors you have had a completed or confirmed appointment with' });
    }

    // prevent duplicate review
    const existing = await Review.findOne({
      patient: req.user._id,
      doctor: doctorId,
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this doctor' });
    }

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

exports.getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email');

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};