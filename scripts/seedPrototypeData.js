const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/user.model');
const Doctor = require('../server/models/doctor.model');
const Patient = require('../server/models/patient.model');
const Appointment = require('../server/models/appointment.model');
const MedicalRecord = require('../server/models/medicalRecord.model');
const Payment = require('../server/models/payment.model');
const Notification = require('../server/models/notification.model');
const Review = require('../server/models/review.model');

const PATIENT_DATA = [
  {
    name: 'Aman Singh',
    email: 'patient.demo@medisync.com',
    phone: '+91 98765 43210',
    gender: 'male',
    dob: '1992-06-15',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Dust Mites'],
    chronicConditions: ['Mild Hypertension'],
    address: 'Plot 42, Green Avenue, Indiranagar, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    review: {
      rating: 5,
      comment: 'Dr. Clare is an exceptional cardiologist! She took the time to listen to all my questions and gave very reassuring, clear guidance on lifestyle modifications.'
    }
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@medisync-demo.com',
    phone: '+91 98765 11223',
    gender: 'female',
    dob: '1995-03-22',
    bloodGroup: 'A+',
    allergies: ['Pollen'],
    chronicConditions: ['Seasonal Rhinitis'],
    address: '7th Cross, Koramangala 4th Block, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    review: {
      rating: 5,
      comment: 'Very empathetic and thorough examination. The clinic was punctual and the diagnosis was explained in plain terms.'
    }
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@medisync-demo.com',
    phone: '+91 98765 22334',
    gender: 'male',
    dob: '1984-11-10',
    bloodGroup: 'B+',
    allergies: ['Sulfa drugs'],
    chronicConditions: ['Pre-diabetes'],
    address: 'Flat 302, Palm Meadows, Whitefield, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    review: {
      rating: 5,
      comment: 'Outstanding care. Dr. Clare detected my early cardiac rhythm irregularity and structured an effective exercise & diet regimen.'
    }
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@medisync-demo.com',
    phone: '+91 98765 33445',
    gender: 'female',
    dob: '1989-08-14',
    bloodGroup: 'AB+',
    allergies: ['Aspirin'],
    chronicConditions: ['Mild Asthma'],
    address: '12th Main, Jayanagar 3rd Block, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    review: {
      rating: 5,
      comment: 'Extremely attentive to medical history. She reviewed all my past lab reports before making any prescription adjustments.'
    }
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@medisync-demo.com',
    phone: '+91 98765 44556',
    gender: 'male',
    dob: '1976-02-18',
    bloodGroup: 'O-',
    allergies: [],
    chronicConditions: ['Hyperlipidemia'],
    address: 'Villa 14, Prestige Golfshire, Nandi Hills Road',
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    review: {
      rating: 5,
      comment: 'Brilliant specialist. My cholesterol levels normalized within 8 weeks under her medication and follow-up schedule.'
    }
  },
  {
    name: 'Sneha Patel',
    email: 'sneha.patel@medisync-demo.com',
    phone: '+91 98765 55667',
    gender: 'female',
    dob: '1998-12-05',
    bloodGroup: 'B-',
    allergies: ['Latex'],
    chronicConditions: [],
    address: '42 Central Boulevard, HSR Layout Sector 2, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    review: {
      rating: 5,
      comment: 'Super friendly doctor and spotless clinic facility. Minimal waiting time and easy digital prescription access.'
    }
  },
  {
    name: 'David Miller',
    email: 'david.miller@medisync-demo.com',
    phone: '+91 98765 66778',
    gender: 'male',
    dob: '1971-07-30',
    bloodGroup: 'A-',
    allergies: ['Iodine contrast dye'],
    chronicConditions: ['Coronary Artery Disease'],
    address: 'Flat 5B, Skyline Residency, MG Road, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400',
    review: {
      rating: 5,
      comment: 'Dr. Clare provided world-class guidance for my post-angioplasty rehabilitation. Her preventive cardiac protocols are top tier.'
    }
  },
  {
    name: 'Fatima Zahra',
    email: 'fatima.zahra@medisync-demo.com',
    phone: '+91 98765 77889',
    gender: 'female',
    dob: '1986-05-19',
    bloodGroup: 'O+',
    allergies: ['Shellfish'],
    chronicConditions: ['Hypothyroidism'],
    address: '88 Richmond Town, Brigade Road, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    review: {
      rating: 4,
      comment: 'Comprehensive stress-echo testing and very kind bedside manner. Highly recommended for preventive cardiology.'
    }
  },
  {
    name: 'Kavita Reddy',
    email: 'kavita.reddy@medisync-demo.com',
    phone: '+91 98765 88990',
    gender: 'female',
    dob: '1979-09-03',
    bloodGroup: 'B+',
    allergies: [],
    chronicConditions: ['Migraine'],
    address: '15/3 Cunningham Road, Vasanth Nagar, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400',
    review: {
      rating: 5,
      comment: 'Clear consultation, answered every question patiently, and the digital follow-up reminders in MediSync are very helpful.'
    }
  },
  {
    name: 'Rohan Desai',
    email: 'rohan.desai@medisync-demo.com',
    phone: '+91 98765 99001',
    gender: 'male',
    dob: '1993-01-25',
    bloodGroup: 'AB-',
    allergies: ['Penicillin'],
    chronicConditions: ['Work-related Stress'],
    address: '22 Tech Hub Lane, Electronic City Phase 1, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    review: {
      rating: 5,
      comment: 'Addressed both my elevated resting heart rate and stress symptoms comprehensively. Feeling much healthier now.'
    }
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@medisync-demo.com',
    phone: '+91 98765 00112',
    gender: 'female',
    dob: '1987-10-12',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['Vitamin D Insufficiency'],
    address: 'Consulate Enclave, Palace Road, Bengaluru',
    picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    review: {
      rating: 5,
      comment: 'Prompt appointment scheduling and very precise diagnosis. The e-Prescription feature made medicine orders effortless.'
    }
  },
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@medisync-demo.com',
    phone: '+91 98765 11335',
    gender: 'male',
    dob: '1980-04-08',
    bloodGroup: 'O+',
    allergies: ['NSAIDs'],
    chronicConditions: ['Mild Hypertension'],
    address: 'Tower C-401, Embassy Springs, Devanahalli',
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    review: {
      rating: 4,
      comment: 'Clear clinical reasoning and actionable health targets. Excellent practitioner with modern clinic equipment.'
    }
  }
];

async function seed() {
  console.log('Connecting to MongoDB for clean demo-email prototype seeding...');
  await mongoose.connect(process.env.MONGO_URI);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 0. Clean up any existing personal emails
  await User.deleteMany({ email: 'aman7t6s@gmail.com' });

  // 1. Ensure Doctor User & Profile
  let doctorUser = await User.findOne({ email: 'dr.clare@medisync.com' });
  if (!doctorUser) {
    // Check if old doctor exists
    doctorUser = await User.findOne({ email: 'chaya90@hotmail.com' });
    if (doctorUser) {
      doctorUser.email = 'dr.clare@medisync.com';
      doctorUser.name = 'Dr. Clare McCullough';
      doctorUser.profilePicture = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400';
      await doctorUser.save();
    } else {
      doctorUser = await User.create({
        name: 'Dr. Clare McCullough',
        email: 'dr.clare@medisync.com',
        password: hashedPassword,
        role: 'doctor',
        phone: '+91 91234 56789',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
      });
    }
  } else {
    doctorUser.name = 'Dr. Clare McCullough';
    doctorUser.profilePicture = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400';
    await doctorUser.save();
  }

  let doctorProfile = await Doctor.findOne({ user: doctorUser._id });
  if (!doctorProfile) {
    doctorProfile = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experienceYears: 14,
      consultationFee: 1200,
      hospital: 'Metro Heart Institute & Multi-Specialty Hospital',
      address: {
        street: '45 Health Boulevard, Tech Zone',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560100'
      },
      bio: 'Senior Interventional Cardiologist specializing in cardiovascular care, preventive cardiology, hypertension management, and echocardiography.',
      isApproved: true,
      approvedAt: new Date(),
      availableSlots: [
        { day: 'Monday', startTime: '09:00', endTime: '10:00', isBooked: false },
        { day: 'Monday', startTime: '10:00', endTime: '11:00', isBooked: true },
        { day: 'Monday', startTime: '14:00', endTime: '15:00', isBooked: false },
        { day: 'Tuesday', startTime: '09:00', endTime: '10:00', isBooked: false },
        { day: 'Tuesday', startTime: '11:00', endTime: '12:00', isBooked: false },
        { day: 'Wednesday', startTime: '10:00', endTime: '11:00', isBooked: false },
        { day: 'Wednesday', startTime: '15:00', endTime: '16:00', isBooked: false },
        { day: 'Thursday', startTime: '09:00', endTime: '10:00', isBooked: false },
        { day: 'Friday', startTime: '10:00', endTime: '11:00', isBooked: false },
        { day: 'Saturday', startTime: '11:00', endTime: '12:00', isBooked: false },
      ]
    });
  } else {
    doctorProfile.specialization = 'Cardiology';
    doctorProfile.qualification = 'MBBS, MD (Cardiology), FACC';
    doctorProfile.experienceYears = 14;
    doctorProfile.consultationFee = 1200;
    doctorProfile.hospital = 'Metro Heart Institute & Multi-Specialty Hospital';
    doctorProfile.bio = 'Senior Interventional Cardiologist specializing in cardiovascular care, preventive cardiology, hypertension management, and echocardiography.';
    doctorProfile.isApproved = true;
    await doctorProfile.save();
  }

  // 2. Seed 12 Patient Users and Patient Profiles with clean demo emails
  console.log('Seeding 12 patient records with demo emails...');
  const createdPatients = [];

  for (const p of PATIENT_DATA) {
    let user = await User.findOne({ email: p.email });
    if (!user) {
      user = await User.create({
        name: p.name,
        email: p.email,
        password: hashedPassword,
        role: 'patient',
        phone: p.phone,
        isEmailVerified: true,
        profilePicture: p.picture,
      });
    } else {
      user.name = p.name;
      user.phone = p.phone;
      user.profilePicture = p.picture;
      await user.save();
    }

    let patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      patient = await Patient.create({
        user: user._id,
        phone: p.phone,
        gender: p.gender,
        dateOfBirth: new Date(p.dob),
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        chronicConditions: p.chronicConditions,
        address: p.address,
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: p.phone
      });
    } else {
      patient.gender = p.gender;
      patient.dateOfBirth = new Date(p.dob);
      patient.bloodGroup = p.bloodGroup;
      patient.allergies = p.allergies;
      patient.chronicConditions = p.chronicConditions;
      patient.address = p.address;
      await patient.save();
    }

    createdPatients.push({ user, patient, review: p.review });
  }

  // 3. Link Saved Doctors for the demo patient
  const mainPatientUser = createdPatients[0].user;
  const mainPatientProfile = createdPatients[0].patient;
  const allApprovedDoctors = await Doctor.find({ isApproved: true }).limit(5);
  mainPatientUser.savedDoctors = allApprovedDoctors.map(d => d._id);
  await mainPatientUser.save();

  // 4. Seed Reviews for Doctor from all 12 patients
  console.log('Seeding 12 rich patient reviews for doctor...');
  await Review.deleteMany({ doctor: doctorUser._id });

  for (const item of createdPatients) {
    await Review.create({
      doctor: doctorUser._id,
      patient: item.user._id,
      rating: item.review.rating,
      comment: item.review.comment,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    });
  }

  // 5. Seed Appointments for Doctor across all 12 patients
  console.log('Seeding appointments across all 12 patients for doctor...');
  await Appointment.deleteMany({ doctor: doctorProfile._id });

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
  const past3Days = new Date(Date.now() - 259200000).toISOString().split('T')[0];
  const past10Days = new Date(Date.now() - 864000000).toISOString().split('T')[0];
  const past20Days = new Date(Date.now() - 1728000000).toISOString().split('T')[0];

  const appointmentConfigs = [
    // Today's Appointments
    { patientIdx: 0, date: todayStr, time: '09:00 AM', reason: 'Routine Cardiac Follow-up & BP Monitoring', status: 'confirmed', fee: 1200 },
    { patientIdx: 1, date: todayStr, time: '10:30 AM', reason: 'Chest Discomfort during Morning Jog', status: 'booked', fee: 1200 },
    { patientIdx: 2, date: todayStr, time: '02:00 PM', reason: 'Pre-diabetes Cardiac Risk Screening', status: 'booked', fee: 1200 },
    { patientIdx: 3, date: todayStr, time: '04:15 PM', reason: 'Palpitations & Shortness of Breath Evaluation', status: 'confirmed', fee: 1200 },
    // Upcoming
    { patientIdx: 4, date: tomorrow, time: '11:00 AM', reason: 'Hyperlipidemia Lipid Control Review', status: 'booked', fee: 1200 },
    { patientIdx: 5, date: tomorrow, time: '03:30 PM', reason: 'Annual Cardiovascular Health Check', status: 'booked', fee: 1200 },
    { patientIdx: 6, date: dayAfter, time: '10:00 AM', reason: 'Post-Angioplasty Rehabilitation Milestone', status: 'confirmed', fee: 1200 },
    { patientIdx: 7, date: dayAfter, time: '01:00 PM', reason: 'Echocardiogram Results Consultation', status: 'booked', fee: 1200 },
    // Past Completed
    { patientIdx: 8, date: past3Days, time: '09:30 AM', reason: 'Hypertensive Medication Dose Titration', status: 'completed', fee: 1200, diagnosis: 'Essential Hypertension - Controlled' },
    { patientIdx: 9, date: past10Days, time: '11:45 AM', reason: 'Workplace Stress & Tachycardia Review', status: 'completed', fee: 1200, diagnosis: 'Sinus Tachycardia - Stress Induced' },
    { patientIdx: 10, date: past10Days, time: '04:00 PM', reason: 'Preventive Cardiac Risk Stratification', status: 'completed', fee: 1200, diagnosis: 'Normal Cardiovascular Parameters' },
    { patientIdx: 11, date: past20Days, time: '02:30 PM', reason: 'Exercise Tolerance Stress Test Review', status: 'completed', fee: 1200, diagnosis: 'Normal Treadmill Test, High Functional Capacity' },
  ];

  for (const item of appointmentConfigs) {
    const pt = createdPatients[item.patientIdx];
    await Appointment.create({
      patient: pt.patient._id,
      doctor: doctorProfile._id,
      date: item.date,
      time: item.time,
      reason: item.reason,
      consultationFee: item.fee,
      status: item.status,
      paymentMode: 'prepaid',
      diagnosis: item.diagnosis || '',
      notes: `Clinical review for ${pt.user.name} (${pt.patient.bloodGroup}).`
    });
  }

  // 6. Seed Medical Records for Main Patient
  await MedicalRecord.deleteMany({
    $or: [{ patient: mainPatientProfile._id }, { patient: mainPatientUser._id }]
  });

  await MedicalRecord.create([
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      title: 'Comprehensive Lipid & Cardiac Biomarker Panel',
      diagnosis: 'Optimal Lipid Profile with Normal Troponin-I',
      symptoms: ['Routine Screening', 'Fitness Assessment'],
      medications: [
        { medicineName: 'CoQ10 Supplement', dosage: '100mg', frequency: 'Once daily after breakfast', duration: '60 days' }
      ],
      testsRecommended: ['Lipid Profile', 'High-Sensitivity CRP', 'HbA1c', 'Serum Creatinine'],
      notes: 'Total cholesterol 174 mg/dL, HDL 54 mg/dL, LDL 98 mg/dL, Triglycerides 110 mg/dL. Excellent cardiovascular health index.',
      attachments: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800']
    },
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      title: '12-Lead Electrocardiogram (ECG) & Echocardiogram',
      diagnosis: 'Normal Sinus Rhythm, Ejection Fraction 64%',
      symptoms: ['Mild Palpitations during intense workout'],
      medications: [
        { medicineName: 'Electrolyte Hydration Sachet', dosage: '1 sachet', frequency: 'Post-workout', duration: 'As needed' }
      ],
      testsRecommended: ['12-Lead Resting ECG', 'Color Doppler 2D Echo'],
      notes: 'No ischemic ST-T changes. Normal chamber dimensions and valvular competence. Cleared for regular marathon training.',
      attachments: ['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800']
    },
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      title: 'Dermatological Allergy & Patch Test Report',
      diagnosis: 'Contact Dermatitis (Mild Nickel & Synthetic Fragrance sensitivity)',
      symptoms: ['Erythema', 'Localized pruritus on wrist'],
      medications: [
        { medicineName: 'Hydrocortisone Cream 1%', dosage: 'Thin layer', frequency: 'Twice daily', duration: '5 days' },
        { medicineName: 'Cetirizine', dosage: '10mg', frequency: 'Once at bedtime', duration: '7 days' }
      ],
      testsRecommended: ['Standard Patch Test Series'],
      notes: 'Avoid metallic watch buckles with nickel content. Use hypoallergenic soaps.',
      attachments: ['https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800']
    },
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      title: 'Annual Executive Health Checkup Summary',
      diagnosis: 'Overall Healthy with Vitamin D3 Mild Insufficiency',
      symptoms: ['Occasional fatigue'],
      medications: [
        { medicineName: 'Cholecalciferol (Vitamin D3)', dosage: '60,000 IU', frequency: 'Once weekly with milk', duration: '8 weeks' }
      ],
      testsRecommended: ['Complete Blood Count', 'Serum Vitamin D3', 'Liver Function Test', 'Thyroid Profile'],
      notes: 'Hemoglobin 15.2 g/dL. Vitamin D3 at 22 ng/mL (optimal > 30 ng/mL). Dietary advice provided.',
      attachments: ['https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800']
    }
  ]);

  // 7. Seed Payments & Invoices
  await Payment.deleteMany({
    $or: [
      { patient: mainPatientProfile._id },
      { patient: mainPatientUser._id },
      { referenceId: { $regex: '^PAY-2026-MED' } }
    ]
  });

  await Payment.create([
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      doctorName: 'Dr. Clare McCullough',
      specialty: 'Cardiology',
      amount: 1200,
      currency: 'INR',
      breakdown: { consultationFee: 1100, serviceTax: 50, platformFee: 50, discountApplied: 0 },
      method: 'card',
      status: 'paid',
      referenceId: 'PAY-2026-MED-84910',
      paidAt: new Date(),
      notes: 'Cardiology Consultation Fee (Paid via Razorpay)'
    },
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      doctorName: 'Dr. Clare McCullough',
      specialty: 'Cardiology',
      amount: 1200,
      currency: 'INR',
      breakdown: { consultationFee: 1100, serviceTax: 50, platformFee: 50, discountApplied: 0 },
      method: 'upi',
      status: 'paid',
      referenceId: 'PAY-2026-MED-73104',
      paidAt: new Date(Date.now() - 259200000),
      notes: 'Cardiac Rhythm Follow-up'
    },
    {
      patient: mainPatientProfile._id,
      doctor: doctorProfile._id,
      doctorName: 'Dr. Clare McCullough',
      specialty: 'Cardiology',
      amount: 1200,
      currency: 'INR',
      breakdown: { consultationFee: 1100, serviceTax: 50, platformFee: 50, discountApplied: 0 },
      method: 'card',
      status: 'paid',
      referenceId: 'PAY-2026-MED-62045',
      paidAt: new Date(Date.now() - 1728000000),
      notes: 'Annual Wellness Consultation'
    }
  ]);

  // 8. Seed Notifications
  await Notification.deleteMany({
    recipient: { $in: [mainPatientUser._id, doctorUser._id] }
  });

  await Notification.create([
    {
      recipient: mainPatientUser._id,
      sender: doctorUser._id,
      title: 'Appointment Confirmed',
      message: `Your consultation with Dr. Clare McCullough is scheduled for today at 09:00 AM.`,
      type: 'appointment',
      isRead: false
    },
    {
      recipient: mainPatientUser._id,
      sender: doctorUser._id,
      title: 'e-Prescription & Notes Issued',
      message: 'Dr. Clare McCullough uploaded your updated prescription for Cardiac Care.',
      type: 'prescription',
      isRead: false
    },
    {
      recipient: mainPatientUser._id,
      title: 'Diagnostic Report Available',
      message: 'New lab report "Comprehensive Lipid & Cardiac Biomarker Panel" is now available in your Health Vault.',
      type: 'medical_record',
      isRead: true
    },
    {
      recipient: mainPatientUser._id,
      title: 'Payment Receipt #PAY-84910',
      message: 'Payment of ₹1,200 received successfully for consultation booking.',
      type: 'payment',
      isRead: true
    },
    // Doctor Notifications
    {
      recipient: doctorUser._id,
      title: 'Today Schedule: 4 Patient Appointments',
      message: 'You have 4 consultations scheduled for today starting with Aman Singh at 09:00 AM.',
      type: 'appointment',
      isRead: false
    },
    {
      recipient: doctorUser._id,
      sender: createdPatients[1].user._id,
      title: 'New Booking from Priya Sharma',
      message: 'Priya Sharma booked a slot for today at 10:30 AM (Reason: Chest Discomfort).',
      type: 'appointment',
      isRead: false
    },
    {
      recipient: doctorUser._id,
      title: 'New 5-Star Review from Rahul Verma',
      message: 'Rahul Verma submitted a 5-star clinical review with feedback.',
      type: 'info',
      isRead: true
    }
  ]);

  console.log('✅ Clean demo-email prototype database seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
