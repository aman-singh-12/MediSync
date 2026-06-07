// Admin controller: dashboard stats, user/doctor management, and payment reporting.
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');

// Get statistics for admin dashboard
const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalAppointments
      },
      totalRevenue,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve doctor
const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { returnDocument: 'after' }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject/Revoke doctor
const rejectDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { returnDocument: 'after' }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments (admin)
const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate('doctor', 'user')
      .populate({ 
        path: 'appointment', 
        select: 'date time doctor patient specialization',
        populate: [
          { path: 'doctor', populate: { path: 'user', select: 'name' } },
          { path: 'patient', populate: { path: 'user', select: 'name' } }
        ]
      })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const formattedPayments = payments.map(p => {
      const appt = p.appointment || {};
      const doctorUser = appt.doctor?.user || p.doctor?.user;
      const patientUser = appt.patient?.user || p.patient?.user;

      return {
        _id: p._id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        referenceId: p.referenceId,
        doctorName: p.doctorName || doctorUser?.name || 'MediSync Practitioner',
        patient: { user: { name: patientUser?.name || 'MediSync Patient' } },
        notes: p.notes,
        specialty: p.specialty || appt.doctor?.specialization || ''
      };
    });

    res.json(formattedPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });
    
    if (user.role === 'doctor') await Doctor.findOneAndDelete({ user: user._id });
    if (user.role === 'patient') await Patient.findOneAndDelete({ user: user._id });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and associated profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminDashboardStats,
  getAllUsers,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  getAllAppointments,
  getPaymentStats,
  getAllPayments,
  deleteUser
};
