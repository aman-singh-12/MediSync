const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/user.model');

const OUTPUT_DIR = path.join(__dirname, '../medisync prototype');
const BASE_URL = 'http://localhost:5173';

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'medisync_development_jwt_secret_key_2026';
};

const createToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '30d' });
};

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Connecting to database to fetch test users...');
  await mongoose.connect(process.env.MONGO_URI);

  const patientUser = await User.findOne({ role: 'patient' });
  const doctorUser = await User.findOne({ role: 'doctor' });
  const adminUser = await User.findOne({ role: 'admin' });

  if (!patientUser || !doctorUser || !adminUser) {
    console.error('Missing user roles for capturing authenticated pages');
  }

  const patientToken = patientUser ? createToken(patientUser._id) : null;
  const doctorToken = doctorUser ? createToken(doctorUser._id) : null;
  const adminToken = adminUser ? createToken(adminUser._id) : null;

  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  const setupContext = async (user, token) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    });
    if (user && token) {
      await context.addInitScript(({ tokenKey, userKey, tokenVal, userVal }) => {
        window.localStorage.setItem(tokenKey, tokenVal);
        window.localStorage.setItem(userKey, JSON.stringify(userVal));
      }, {
        tokenKey: 'medisync_token',
        userKey: 'medisync_user',
        tokenVal: token,
        userVal: user.toObject ? user.toObject() : user,
      });
    }
    return context;
  };

  const pagesToCapture = [
    // Public / Auth Pages
    { name: '01_Login.png', path: '/login', role: 'public' },
    { name: '02_Register.png', path: '/register', role: 'public' },
    { name: '03_ForgotPassword.png', path: '/forgot-password', role: 'public' },
    { name: '04_OtpVerification.png', path: '/verify-otp', role: 'public' },
    { name: '05_Admin_Login.png', path: '/admin/portal/login', role: 'public' },
    { name: '06_Admin_Register.png', path: '/admin/portal/register', role: 'public' },
    { name: '07_Onboarding_Survey.png', path: '/onboarding-survey', role: 'patient' },

    // Patient Pages
    { name: '08_Patient_Dashboard.png', path: '/dashboard', role: 'patient' },
    { name: '09_Patient_Find_Doctors.png', path: '/find-doctors', role: 'patient' },
    { name: '10_Patient_Book_Appointment.png', path: '/book-appointment', role: 'patient' },
    { name: '11_Patient_Appointments_History.png', path: '/appointment-history', role: 'patient' },
    { name: '12_Patient_Medical_Records.png', path: '/medical-records', role: 'patient' },
    { name: '13_Patient_Medical_Knowledge_AI.png', path: '/medical-knowledge', role: 'patient' },
    { name: '14_Patient_Favorites.png', path: '/favorites', role: 'patient' },
    { name: '15_Patient_Payments.png', path: '/payments', role: 'patient' },
    { name: '16_Patient_Settings.png', path: '/settings', role: 'patient' },
    { name: '17_Patient_Notifications.png', path: '/notifications', role: 'patient' },

    // Doctor Pages
    { name: '18_Doctor_Dashboard.png', path: '/doctor/dashboard', role: 'doctor' },
    { name: '19_Doctor_Appointments.png', path: '/doctor/appointments', role: 'doctor' },
    { name: '20_Doctor_Availability.png', path: '/doctor/availability', role: 'doctor' },
    { name: '21_Doctor_Patients.png', path: '/doctor/patients', role: 'doctor' },
    { name: '22_Doctor_Reviews.png', path: '/doctor/reviews', role: 'doctor' },
    { name: '23_Doctor_My_Profile.png', path: '/doctor/my-profile', role: 'doctor' },

    // Admin Pages
    { name: '24_Admin_Dashboard.png', path: '/dashboard', role: 'admin' },
    { name: '25_Admin_Verify_Doctors.png', path: '/admin/doctors', role: 'admin' },
    { name: '26_Admin_Manage_Users.png', path: '/admin/users', role: 'admin' },
    { name: '27_Admin_Rubric_Lab.png', path: '/admin/rubric-lab', role: 'admin' },
  ];

  for (const pageInfo of pagesToCapture) {
    let user = null;
    let token = null;

    if (pageInfo.role === 'patient') {
      user = patientUser;
      token = patientToken;
    } else if (pageInfo.role === 'doctor') {
      user = doctorUser;
      token = doctorToken;
    } else if (pageInfo.role === 'admin') {
      user = adminUser;
      token = adminToken;
    }

    const context = await setupContext(user, token);
    const page = await context.newPage();

    try {
      console.log(`Capturing [${pageInfo.role}] ${pageInfo.path} -> ${pageInfo.name}`);
      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      // Give a little time for animations, cards, and data queries to settle
      await page.waitForTimeout(1200);

      const filePath = path.join(OUTPUT_DIR, pageInfo.name);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`  ✓ Saved: ${pageInfo.name}`);
    } catch (err) {
      console.error(`  ✗ Error capturing ${pageInfo.path}:`, err.message);
      try {
        const filePath = path.join(OUTPUT_DIR, pageInfo.name);
        await page.screenshot({ path: filePath, fullPage: true });
      } catch (e) {}
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();
  await mongoose.disconnect();
  console.log(`\n🎉 Finished! All screenshots saved in: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
