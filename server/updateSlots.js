const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./models/doctor.model');

dotenv.config();

const updateSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medisync');
    
    const availableSlots = [
      { day: 'Monday', startTime: '09:00', endTime: '10:00', isBooked: false },
      { day: 'Monday', startTime: '10:00', endTime: '11:00', isBooked: false },
      { day: 'Monday', startTime: '14:00', endTime: '15:00', isBooked: false },
      { day: 'Tuesday', startTime: '09:00', endTime: '10:00', isBooked: false },
      { day: 'Tuesday', startTime: '11:00', endTime: '12:00', isBooked: false },
      { day: 'Tuesday', startTime: '15:00', endTime: '16:00', isBooked: false },
      { day: 'Wednesday', startTime: '10:00', endTime: '11:00', isBooked: false },
      { day: 'Wednesday', startTime: '14:00', endTime: '15:00', isBooked: false },
      { day: 'Wednesday', startTime: '16:00', endTime: '17:00', isBooked: false },
      { day: 'Thursday', startTime: '09:00', endTime: '10:00', isBooked: false },
      { day: 'Thursday', startTime: '11:00', endTime: '12:00', isBooked: false },
      { day: 'Thursday', startTime: '16:00', endTime: '17:00', isBooked: false },
      { day: 'Friday', startTime: '09:00', endTime: '10:00', isBooked: false },
      { day: 'Friday', startTime: '13:00', endTime: '14:00', isBooked: false },
      { day: 'Friday', startTime: '15:00', endTime: '16:00', isBooked: false },
      { day: 'Saturday', startTime: '10:00', endTime: '11:00', isBooked: false },
      { day: 'Saturday', startTime: '12:00', endTime: '13:00', isBooked: false },
    ];

    await Doctor.updateMany({}, { $set: { availableSlots: availableSlots } });
    console.log('Updated all doctors with more slots!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateSlots();
