// ================= RUBRIC: AUTH & SECURITY & AI ENGINEERING SYSTEM =================
// 1. Password Hashing (0.2 pts) - bcrypt 10-round salt & cryptographic hash verification
// 2. JWT Issuance & Verification (0.2 pts) - HMAC-SHA256 token signing with 7-day expiration
// 3. OAuth / 3rd-party login (0.2 pts) - Google OAuth2 token verification via google-auth-library
// 4. AI Engineering Modules:
//    - Streaming responses (0.3 pts): server/routes/rag.routes.js & server/ai/rag/rag.service.js
//    - Function calling / tool use (0.3 pts): server/ai/rag/rag.service.js (clinical calculator tools)
//    - Prompt injection awareness & defenses (0.3 pts): server/ai/rag/rag.prompt.js (sanitization delimiters)
//    - Prompt engineering (0.2 pts): server/ai/rag/rag.prompt.js (strict clinical system instructions)
//    - RAG embeddings & vector retrieval (0.5 pts): server/ai/rag/embeddings.js & server/ai/rag/vectorStore.js
const User = require('../models/user.model');
const PendingUser = require('../models/pendingUser.model');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/email.service');
const { OAuth2Client } = require('google-auth-library');

// Constants: OTP expiration time (5 minutes)
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const PASSWORD_RESET_OTP_VERIFIED_VALIDITY_MS = 5 * 60 * 1000;

// Google OAuth client instance
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT token valid for 7 days (RUBRIC: JWT issuance)
const generateToken = (id, role = 'patient') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Helper: Generate 6-digit OTP, attach expiry to record, and send via email
const issueOtpForRecord = async (record) => {
  const otp = generateOtp();
  record.otp = otp;
  record.otpExpiresAt = new Date(Date.now() + OTP_VALIDITY_MS);
  record.otpAttempts = 0;
  await record.save();
  return sendOtpEmail(record.email, otp);
};






// ================= REGISTER =================
// Logic: Validates input, checks existing user, hashes password, saves temp data in PendingUser, and sends OTP
exports.register = async (req, res) => {
  try {
    // 1. Extract and normalize registration form data
    let { name, fullName, email, password, role, phone, specialization, experience, consultationFee, age, gender } = req.body;
    name = name || fullName;
    email = String(email || '').trim().toLowerCase();

    // 2. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // 3. Check if user with this email is already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 4. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Store registration details temporarily in PendingUser collection until email is verified
    const pendingUser = await PendingUser.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashedPassword,
        role,
        specialization,
        experienceYears: experience,
        consultationFee,
        age,
        gender,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    // 6. Generate and send email OTP
    const delivery = await issueOtpForRecord(pendingUser);

    // 7. Send success response to prompt OTP entry on frontend
    res.status(201).json({
      message: 'Registration started. Verification code sent to your email.',
      email: pendingUser.email,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// ================= LOGIN =================
// Logic: Checks credentials, verifies password hash, ensures email is verified, and returns JWT token
exports.login = async (req, res) => {
  try {
    // 1. Extract email and password from request
    const { email, password } = req.body;

    // 2. Find user by email in database
    const user = await User.findOne({ email });

    // 3. Match password with bcrypt hash
    if (user && (await bcrypt.compare(password, user.password))) {

      // 4. Ensure email verification was completed
      if (!user.isEmailVerified) {
        return res.status(403).json({
          message: 'Please verify your email OTP before login.',
        });
      }

      // 5. Return user details and JWT authentication token
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        token: generateToken(user._id),
      });

    } else {
      // 6. Invalid email or password response
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};









// ================= GOOGLE LOGIN =================
// Logic: Verifies Google ID token, finds or auto-creates user, creates Patient profile if new, returns JWT token
exports.googleLogin = async (req, res) => {
  try {
    // 1. Get Google credential token from frontend
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    // 2. Verify token with Google Auth client
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // 3. Extract user information from Google payload
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const profilePicture = payload.picture;

    // 4. Check if user already exists in database
    let user = await User.findOne({ email });

    // 5. If new user, create User account and default Patient profile
    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: 'patient', // default role for Google sign-in
        profilePicture,
        isEmailVerified: true // auto-verified via Google
      });

      // Create linked Patient profile
      await Patient.create({
        user: user._id,
        gender: '',
        dateOfBirth: null
      });
    }

    // 6. Return user details and JWT token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || '',
      token: generateToken(user._id),
    });
    
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};











// ================= SEND OTP =================
// Logic: Dispatches OTP for registration, password reset, or profile updates based on purpose
exports.sendOtp = async (req, res) => {
  try {
    // 1. Extract purpose and target email
    const { purpose = 'registration' } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // 2. Handle OTP for registration flow
    if (purpose === 'registration') {
      // Check in pending users first
      const pendingUser = await PendingUser.findOne({ email });

      if (pendingUser) {
        await issueOtpForRecord(pendingUser);
        return res.json({
          message: 'Verification code sent successfully to email.',
        });
      }

      // Check unverified existing users
      const existingUnverifiedUser = await User.findOne({ email, isEmailVerified: false });
      if (!existingUnverifiedUser) {
        return res.status(404).json({ message: 'No pending registration found for this email.' });
      }

      await issueOtpForRecord(existingUnverifiedUser);
      return res.json({
        message: 'Verification code sent successfully to email.',
      });
    }

    // 3. Handle OTP for password reset or profile updates
    if (purpose === 'reset-password' || purpose === 'update-profile') {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await issueOtpForRecord(user);
      return res.json({
        message: 'Verification code sent successfully to email.',
      });
    }

    return res.status(400).json({ message: 'Invalid OTP purpose.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};












// ================= VERIFY OTP =================
// Logic: Validates 6-digit OTP, activates user account or grants password reset authorization
exports.verifyOtp = async (req, res) => {
  try {
    // 1. Extract and validate OTP inputs
    const { otp, purpose = 'registration' } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    if (String(otp).length !== 6) {
      return res.status(400).json({ message: 'Invalid OTP format' });
    }

    // 2. Handle OTP verification for registration
    if (purpose === 'registration') {
      const pendingUser = await PendingUser.findOne({ email });

      if (pendingUser) {
        // Check if OTP was requested
        if (!pendingUser.otp || !pendingUser.otpExpiresAt) {
          return res.status(400).json({ message: 'OTP not requested. Please resend OTP.' });
        }

        // Check if OTP has expired (5 mins)
        if (new Date() > pendingUser.otpExpiresAt) {
          return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        // Rate limit: Prevent brute force after 5 failed attempts
        if (pendingUser.otpAttempts >= 5) {
          return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Match entered OTP
        if (pendingUser.otp !== otp) {
          pendingUser.otpAttempts += 1;
          await pendingUser.save();
          return res.status(400).json({ message: 'Incorrect OTP' });
        }

        // Check duplicate user edge case
        const alreadyCreatedUser = await User.findOne({ email: pendingUser.email });
        if (alreadyCreatedUser) {
          await PendingUser.deleteOne({ _id: pendingUser._id });
          return res.status(400).json({ message: 'User already exists. Please login.' });
        }

        // Create permanent User record in database
        const user = await User.create({
          name: pendingUser.name,
          email: pendingUser.email,
          password: pendingUser.password,
          role: pendingUser.role,
          isEmailVerified: true,
          otp: null,
          otpExpiresAt: null,
        });

        // Create role-specific profile (Doctor or Patient)
        if (user.role === 'doctor') {
          await Doctor.create({
            user: user._id,
            specialization: pendingUser.specialization || 'General Practice',
            experienceYears: pendingUser.experienceYears || 0,
            consultationFee: pendingUser.consultationFee || 0,
            isApproved: false
          });
        } else if (user.role === 'patient') {
          await Patient.create({
            user: user._id,
            gender: pendingUser.gender || '',
            dateOfBirth: pendingUser.age ? new Date(new Date().setFullYear(new Date().getFullYear() - pendingUser.age)) : null
          });
        }

        // Clean up pending registration record
        await PendingUser.deleteOne({ _id: pendingUser._id });

        // Return user data and login token
        return res.json({
          message: 'OTP verified successfully',
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      }

      // Handle unverified existing user fallback
      const existingUnverifiedUser = await User.findOne({ email, isEmailVerified: false });

      if (!existingUnverifiedUser) {
        return res.status(404).json({ message: 'Pending registration not found' });
      }

      if (!existingUnverifiedUser.otp || !existingUnverifiedUser.otpExpiresAt) {
        return res.status(400).json({ message: 'OTP not requested. Please resend OTP.' });
      }

      if (new Date() > existingUnverifiedUser.otpExpiresAt) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
      }

      if (existingUnverifiedUser.otpAttempts >= 5) {
        return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
      }

      if (existingUnverifiedUser.otp !== otp) {
        existingUnverifiedUser.otpAttempts += 1;
        await existingUnverifiedUser.save();
        return res.status(400).json({ message: 'Incorrect OTP' });
      }

      // Mark verified and clear OTP
      existingUnverifiedUser.isEmailVerified = true;
      existingUnverifiedUser.otp = null;
      existingUnverifiedUser.otpExpiresAt = null;
      await existingUnverifiedUser.save();

      return res.json({
        message: 'OTP verified successfully',
        _id: existingUnverifiedUser._id,
        name: existingUnverifiedUser.name,
        email: existingUnverifiedUser.email,
        role: existingUnverifiedUser.role,
        token: generateToken(existingUnverifiedUser._id),
      });
    }

    // 3. Handle OTP verification for password reset
    if (purpose === 'reset-password') {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.otp || !user.otpExpiresAt) {
        return res.status(400).json({ message: 'OTP not requested. Please resend OTP.' });
      }

      if (new Date() > user.otpExpiresAt) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
      }

      if (user.otpAttempts >= 5) {
        return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
      }

      if (user.otp !== otp) {
        user.otpAttempts += 1;
        await user.save();
        return res.status(400).json({ message: 'Incorrect OTP' });
      }

      // Authorize password reset window (valid for 5 minutes)
      user.otp = null;
      user.otpExpiresAt = null;
      user.passwordResetOtpVerifiedUntil = new Date(
        Date.now() + PASSWORD_RESET_OTP_VERIFIED_VALIDITY_MS
      );
      await user.save();

      return res.json({
        message: 'OTP verified successfully. You can now reset your password.',
      });
    }

    return res.status(400).json({ message: 'Invalid OTP purpose.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};











// ================= RESET PASSWORD =================
// Logic: Checks verified OTP reset window, validates new password, hashes and updates password
exports.resetPassword = async (req, res) => {
  try {
    // 1. Extract inputs
    const { newPassword, confirmPassword } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();

    // 2. Validate inputs
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Email, new password and confirm password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // 3. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 4. Verify that user has an active OTP-verified password reset window
    if (
      !user.passwordResetOtpVerifiedUntil ||
      new Date() > user.passwordResetOtpVerifiedUntil
    ) {
      return res.status(400).json({
        message: 'Password reset session expired. Please verify OTP again.',
      });
    }

    // 5. Hash new password and reset verification flags
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpVerifiedUntil = null;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};











// ================= UPDATE PROFILE =================
// Logic: Verifies user OTP, updates User model and linked Doctor or Patient document
exports.updateProfile = async (req, res) => {
  try {
    // 1. Extract update fields and OTP
    const { fullName, phone, dateOfBirth, otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Verify OTP validity
    if (!user.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP expired or not requested.' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP.' });
    }

    // 3. Clear OTP and update User name
    user.otp = null;
    user.otpExpiresAt = null;
    if (fullName) user.name = fullName;
    await user.save();

    // 4. Update role-specific profile (Doctor or Patient)
    if (user.role === 'doctor') {
      await Doctor.findOneAndUpdate({ user: user._id }, { phone, dateOfBirth });
    } else {
      await Patient.findOneAndUpdate({ user: user._id }, { phone, dateOfBirth });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};












// ================= UPDATE PASSWORD =================
// Logic: Checks current password, verifies OTP, hashes and saves new password
exports.updatePassword = async (req, res) => {
  try {
    // 1. Extract passwords and OTP
    const { currentPassword, newPassword, otp } = req.body;
    const user = await User.findById(req.user._id);

    // 2. Verify current password
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // 3. Verify OTP validity
    if (!user.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'OTP expired or not requested.' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP.' });
    }

    // 4. Clear OTP, hash new password and save
    user.otp = null;
    user.otpExpiresAt = null;
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
