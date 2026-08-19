const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config();

const User = require('./models/user.model');
const Doctor = require('./models/doctor.model');
const Patient = require('./models/patient.model');
const Appointment = require('./models/appointment.model');

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI in .env file');
  process.exit(1);
}

const specializations = [
  'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Pediatrics', 'Orthopedics', 'Psychiatry', 'Oncology', 'Gynaecology'
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing related data (optional, but good for a fresh start)
    // Actually, I will NOT clear, just append.

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    console.log('Generating dummy doctors...');
    const createdDoctors = [];
    for (let i = 0; i < 50; i++) {
      const user = new User({
        name: `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number({ style: 'national' }),
        password: hashedPassword,
        role: 'doctor',
        isEmailVerified: true,
        profilePicture: faker.image.avatar(),
      });
      const savedUser = await user.save();

      const doctor = new Doctor({
        user: savedUser._id,
        specialization: faker.helpers.arrayElement(specializations),
        qualification: 'MBBS, MD',
        experienceYears: faker.number.int({ min: 2, max: 30 }),
        consultationFee: faker.number.int({ min: 300, max: 1500 }),
        hospital: `${faker.company.name()} Hospital`,
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
        },
        bio: faker.lorem.paragraph(),
        availableSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '10:00', isBooked: false },
          { day: 'Tuesday', startTime: '11:00', endTime: '12:00', isBooked: false },
          { day: 'Wednesday', startTime: '14:00', endTime: '15:00', isBooked: false },
          { day: 'Thursday', startTime: '16:00', endTime: '17:00', isBooked: false },
          { day: 'Friday', startTime: '09:00', endTime: '10:00', isBooked: false },
        ],
        isApproved: true,
        approvedAt: new Date(),
      });
      const savedDoctor = await doctor.save();
      createdDoctors.push(savedDoctor);
    }
    console.log('Successfully seeded 50 doctors.');

    console.log('Generating dummy patients...');
    const createdPatients = [];
    for (let i = 0; i < 50; i++) {
      const user = new User({
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number({ style: 'national' }),
        password: hashedPassword,
        role: 'patient',
        isEmailVerified: true,
        profilePicture: faker.image.avatar(),
      });
      const savedUser = await user.save();

      const patient = new Patient({
        user: savedUser._id,
        phone: user.phone,
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 85, mode: 'age' }),
        bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        allergies: [faker.science.chemicalElement().name],
        chronicConditions: [],
        address: faker.location.streetAddress(),
      });
      const savedPatient = await patient.save();
      createdPatients.push(savedPatient);
    }
    console.log('Successfully seeded 50 patients.');

    console.log('Generating some appointments...');
    for (let i = 0; i < 30; i++) {
      const p = faker.helpers.arrayElement(createdPatients);
      const d = faker.helpers.arrayElement(createdDoctors);
      
      const appt = new Appointment({
        patient: p._id,
        doctor: d._id,
        date: faker.date.soon({ days: 10 }).toISOString().split('T')[0], // e.g. "2026-08-25"
        time: faker.helpers.arrayElement(['09:00', '11:00', '14:00', '16:00']),
        reason: faker.lorem.sentence(),
        consultationFee: d.consultationFee,
        status: faker.helpers.arrayElement(['booked', 'confirmed', 'completed']),
        paymentMode: 'prepaid'
      });
      await appt.save();
    }
    console.log('Successfully seeded 30 appointments.');

    console.log('Demo data generation complete! Total ~130 entries created.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
