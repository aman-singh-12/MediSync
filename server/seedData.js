const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config();

const User = require('./models/user.model');
const Doctor = require('./models/doctor.model');

// Check if MONGO_URI is available
if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI in .env file');
  process.exit(1);
}

const specializations = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Psychiatry',
  'Oncology',
  'Gynaecology'
];

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Default password for all seed doctors is 'password123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    console.log('Generating 100 dummy doctors...');

    for (let i = 0; i < 100; i++) {
      // Create User
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

      // Standard slots
      const availableSlots = [
        { day: 'Monday', startTime: '09:00', endTime: '10:00', isBooked: false },
        { day: 'Monday', startTime: '10:00', endTime: '11:00', isBooked: false },
        { day: 'Tuesday', startTime: '11:00', endTime: '12:00', isBooked: false },
        { day: 'Wednesday', startTime: '14:00', endTime: '15:00', isBooked: false },
        { day: 'Thursday', startTime: '16:00', endTime: '17:00', isBooked: false },
        { day: 'Friday', startTime: '09:00', endTime: '10:00', isBooked: false },
      ];

      // Create Doctor profile
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
        availableSlots: availableSlots,
        isApproved: true,
        approvedAt: new Date(),
      });

      await doctor.save();
    }

    console.log('Successfully seeded 100 doctors!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDoctors();
