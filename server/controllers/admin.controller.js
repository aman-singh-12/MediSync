// Admin controller: dashboard stats, user/doctor management, and payment reporting.
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Payment = require('../models/payment.model');




// ================= GET ADMIN DASHBOARD STATS =================
// Logic: Counts users, doctors, appointments, aggregates revenue from paid transactions, and returns recent signups
const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Calculate overall system metrics
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // 2. Aggregate total revenue collected from paid payments
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // 3. Fetch 5 most recent registered users
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 4. Return combined dashboard overview
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






// ================= GET ALL USERS =================
// Logic: Retrieves all users excluding password hashes, sorted newest first
const getAllUsers = async (req, res) => {
  try {
    // 1. Fetch user records without password fields
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};







// ================= GET ALL DOCTORS =================
// Logic: Retrieves all doctors populated with user account information
const getAllDoctors = async (req, res) => {
  try {
    // 1. Fetch doctor records populated with user details
    const doctors = await Doctor.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// ================= APPROVE DOCTOR =================
// Logic: Updates doctor's approval status to true so they appear in public search and booking
const approveDoctor = async (req, res) => {
  try {
    // 1. Find and set isApproved to true
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








// ================= REJECT / REVOKE DOCTOR =================
// Logic: Sets isApproved to false to remove doctor from public availability
const rejectDoctor = async (req, res) => {
  try {
    // 1. Find and set isApproved to false
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








// ================= GET ALL APPOINTMENTS =================
// Logic: Retrieves all platform appointments populated with doctor and patient names
const getAllAppointments = async (req, res) => {
  try {
    // 1. Fetch all appointments with nested user details
    const appointments = await Appointment.find()
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};










// ================= GET PAYMENT STATS =================
// Logic: Aggregates payment totals and counts grouped by status (paid, refunded, pending)
const getPaymentStats = async (req, res) => {
  try {
    // 1. Aggregate payments by payment status
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










// ================= GET ALL PAYMENTS =================
// Logic: Fetches paginated payment history and formats doctor and patient details for administration view
const getAllPayments = async (req, res) => {
  try {
    // 1. Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // 2. Fetch payments populated with appointment, doctor, and patient data
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
      
    // 3. Format payment objects with fallback labels
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








// ================= DELETE USER =================
// Logic: Protects admin accounts, cascade deletes associated Doctor/Patient profile, and removes User
const deleteUser = async (req, res) => {
  try {
    // 1. Find target user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // 2. Protect admin accounts from deletion
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });
    
    // 3. Cascade delete associated Doctor or Patient document
    if (user.role === 'doctor') await Doctor.findOneAndDelete({ user: user._id });
    if (user.role === 'patient') await Patient.findOneAndDelete({ user: user._id });
    
    // 4. Delete user account record
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

