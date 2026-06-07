// Appointment controller: booking, listing, updating, cancelling, and notifications.
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const { createNotification } = require('../services/notification.service');
const crypto = require('crypto');

// Book appointment (patient)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, paymentMode } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    if (!doctorId) {
      return res.status(400).json({ message: 'Please select a doctor' });
    }

    // Get the patient profile for the current user
    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient profile not found. Please complete your profile.' });
    }

    // Check for slot conflict
    const exists = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $nin: ['cancelled'] },
    });

    if (exists) {
      return res.status(400).json({ message: 'This slot is already booked. Please choose a different time.' });
    }

    const doctorProfile = await Doctor.findById(doctorId);
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const consultationFee = doctorProfile.consultationFee || 0;

    // Check availability in doctor's slots
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingDate = new Date(date);
    const dayOfWeek = days[bookingDate.getDay()];

    const matchingSlot = doctorProfile.availableSlots.find(s => 
      s.day === dayOfWeek && 
      s.startTime <= time && 
      s.endTime >= time
    );

    if (!matchingSlot) {
      return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek} at ${time}. Please check their available slots.` });
    }

    // Check if slot is already taken
    const alreadyBooked = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $nin: ['cancelled'] }
    });

    if (alreadyBooked) {
      return res.status(400).json({ message: 'This time slot is already booked. Please choose another time.' });
    }

    const appointment = await Appointment.create({
      patient: patientProfile._id,
      doctor: doctorId,
      date,
      time,
      reason: reason || '',
      consultationFee,
      paymentMode: paymentMode || 'prepaid',
    });

    // Create a transaction record if prepaid or wallet
    if (paymentMode === 'prepaid' || paymentMode === 'wallet') {
      if (paymentMode === 'wallet') {
        const user = await User.findById(req.user._id);
        if (user.walletBalance < consultationFee) {
          // If wallet balance is insufficient, delete the appointment and throw error
          await Appointment.findByIdAndDelete(appointment._id);
          return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        // Deduct from wallet
        user.walletBalance -= consultationFee;
        await user.save();
      }

      await Payment.create({
        patient: patientProfile._id,
        doctor: doctorId,
        appointment: appointment._id,
        doctorName: doctorProfile.user?.name || 'Doctor',
        specialty: doctorProfile.specialization || 'General',
        amount: consultationFee,
        method: paymentMode === 'wallet' ? 'wallet' : 'card',
        status: 'paid',
        referenceId: `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        paidAt: new Date(),
        notes: `Appointment booking on ${date} at ${time} via ${paymentMode}`
      });
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' },
      });

    // Notify doctor
    if (doctorProfile && doctorProfile.user) {
      await createNotification({
        recipient: doctorProfile.user,
        type: 'appointment',
        title: 'New Appointment Booked',
        message: `A new appointment has been booked for ${date} at ${time}.`,
        data: { appointmentId: appointment._id }
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get my appointments (patient)
exports.getMyAppointments = async (req, res) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (!patientProfile) {
      return res.json([]);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { patient: patientProfile._id };
    
    const [appointments, total, statsAgg] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(query),
      Appointment.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            upcoming: {
              $sum: {
                $cond: [{ $in: ['$status', ['booked', 'confirmed', 'rescheduled']] }, 1, 0]
              }
            },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const stats = statsAgg[0] || { total: 0, upcoming: 0, completed: 0, cancelled: 0 };
    res.json({ appointments, total, stats, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel appointment (patient or admin)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
    }

    // Identify roles and profiles
    const patientProfile = await Patient.findOne({ user: req.user._id });
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    const isAdmin = req.user.role === 'admin';

    const isPatientOwner = patientProfile && appointment.patient.toString() === patientProfile._id.toString();
    const isDoctorOwner = doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString();

    if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Handle Refund for Prepaid Bookings
    if (appointment.paymentMode === 'prepaid') {
      const originalPayment = await Payment.findOne({
        appointment: appointment._id,
        status: 'paid'
      });

      if (originalPayment) {
        // 1. Create Refund Transaction
        await Payment.create({
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointment: appointment._id,
          amount: originalPayment.amount,
          doctorName: originalPayment.doctorName,
          specialty: originalPayment.specialty,
          type: 'refund',
          transactionType: 'credit',
          status: 'refunded',
          referenceId: `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          paidAt: new Date(),
          notes: `Refund for cancelled appointment on ${appointment.date}`
        });

        // 2. Update Patient's Wallet Balance
        // Find the user associated with the patient profile
        const pProfile = await Patient.findById(appointment.patient);
        if (pProfile) {
          await User.findByIdAndUpdate(pProfile.user, {
            $inc: { walletBalance: originalPayment.amount }
          });
        }
      }
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' },
      });

    // Notify appropriate party
    if (isPatientOwner) {
      // Notify doctor
      const targetDoctor = await Doctor.findById(appointment.doctor);
      if (targetDoctor) {
        await createNotification({
          recipient: targetDoctor.user,
          type: 'appointment',
          title: 'Appointment Cancelled',
          message: `Appointment on ${appointment.date} at ${appointment.time} has been cancelled by the patient.`,
          data: { appointmentId: appointment._id }
        });
      }
    } else if (isDoctorOwner || isAdmin) {
      // Notify patient
      const targetPatient = await Patient.findById(appointment.patient);
      if (targetPatient) {
        await createNotification({
          recipient: targetPatient.user,
          type: 'appointment',
          title: 'Appointment Cancelled',
          message: `Your appointment on ${appointment.date} at ${appointment.time} has been cancelled.`,
          data: { appointmentId: appointment._id }
        });
      }
    }

    res.json({ message: 'Appointment cancelled', appointment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (!doctorProfile) return res.json({ appointments: [], total: 0 });

    const { search, status, view, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { doctor: doctorProfile._id };
    const today = new Date().toLocaleDateString('en-CA');

    if (view === 'upcoming') {
      query.date = { $gte: today };
      query.status = { $nin: ['cancelled', 'completed'] };
    } else if (view === 'past') {
      query.$or = [
        { date: { $lt: today } },
        { status: { $in: ['cancelled', 'completed'] } }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Search by Patient Name
    if (search) {
      const User = require('../models/user.model');
      const Patient = require('../models/patient.model');
      
      const matchingUsers = await User.find({
        name: { $regex: search, $options: 'i' }
      }).distinct('_id');
      
      const matchingPatients = await Patient.find({
        user: { $in: matchingUsers }
      }).distinct('_id');
      
      query.patient = { $in: matchingPatients };
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email profilePicture' },
      })
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      appointments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update appointment status (doctor / admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, diagnosis, date, time } = req.body;
    const validStatuses = ['booked', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'reschedule_requested'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status.` });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify ownership
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    const isDoctor = doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (notes) appointment.notes = notes;
    if (diagnosis) appointment.diagnosis = diagnosis;

    if (status) {
      if (status === 'rescheduled' && appointment.status === 'reschedule_requested') {
        appointment.date = appointment.requestedDate;
        appointment.time = appointment.requestedTime;
        appointment.requestedDate = null;
        appointment.requestedTime = null;
        appointment.status = 'rescheduled';
      } else if (appointment.status === 'reschedule_requested' && status !== 'rescheduled' && status !== 'reschedule_requested') {
        // If rejected, just clear the requested fields and apply the new status (like 'booked' or 'confirmed')
        appointment.requestedDate = null;
        appointment.requestedTime = null;
        appointment.status = status;
      } else {
        appointment.status = status;
      }
    }

    await appointment.save();

    // Re-fetch populated appointment for response
    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } });

    // Notify patient
    const targetPatient = await Patient.findById(appointment.patient);
    if (targetPatient) {
      await createNotification({
        recipient: targetPatient.user,
        type: 'appointment',
        title: 'Appointment Updated',
        message: `Your appointment status has been updated to ${status}.`,
        data: { appointmentId: appointment._id }
      });
    }

    res.json({ message: `Appointment updated successfully`, appointment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, time, reason } = req.body;
    console.log('Reschedule Request:', { id: req.params.id, date, time, reason });

    if (!date || !time) {
      return res.status(400).json({ message: 'New date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const patientProfile = await Patient.findOne({ user: req.user._id });
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    const isAdmin = req.user.role === 'admin';
    
    const isPatient = patientProfile && appointment.patient.toString() === patientProfile._id.toString();
    const isDoctor = doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString();
    
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check conflict
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      date,
      time,
      status: { $nin: ['cancelled'] },
    });

    if (conflict) {
      return res.status(400).json({ message: 'The new time slot is already booked' });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        requestedDate: date, 
        requestedTime: time, 
        status: 'reschedule_requested',
        ...(reason && { rescheduleReason: reason })
      },
      { returnDocument: 'after' }
    ).populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email' },
    }).populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email' },
    });

    // Notify other party
    let recipientUser;
    if (isPatient) {
      const d = await Doctor.findById(updated.doctor);
      recipientUser = d?.user;
    } else {
      const p = await Patient.findById(updated.patient);
      recipientUser = p?.user;
    }

    if (recipientUser) {
      await createNotification({
        recipient: recipientUser,
        type: 'appointment',
        title: 'Appointment Rescheduled',
        message: `Appointment rescheduled to ${date} at ${time}.`,
        data: { appointmentId: updated._id }
      });
    }

    res.json({ message: 'Appointment rescheduled successfully', appointment: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all appointments (admin)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
