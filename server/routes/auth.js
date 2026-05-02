const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { protect } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/sendEmail');

// generate a 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// helper to create and store OTP
async function createOTP(email, purpose) {
  const cleanEmail = email.toLowerCase().trim();

  // clear any old OTPs for this email + purpose
  await OTP.deleteMany({ email: cleanEmail, purpose });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await OTP.create({ email: cleanEmail, code, purpose, expiresAt });
  console.log(`OTP created for ${cleanEmail} [${purpose}]: ${code}`);
  return code;
}

// helper to verify OTP - finds and removes in one step
async function verifyOTP(email, code, purpose) {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const otpRecord = await OTP.findOne({
    email: cleanEmail,
    purpose,
    code: cleanCode,
    expiresAt: { $gt: new Date() }
  });

  if (otpRecord) {
    // valid OTP found - delete it so it can't be reused
    await OTP.deleteMany({ email: cleanEmail, purpose });
    return true;
  }

  // check if an expired OTP exists (to give better error message)
  const expiredOTP = await OTP.findOne({ email: cleanEmail, purpose, code: cleanCode });
  if (expiredOTP) {
    return 'expired';
  }

  return false;
}

// helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ============================================
// STEP 1: Register - create account & send OTP
// ============================================
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, password, role } = req.body;
    const email = req.body.email.toLowerCase().trim();

    // check if verified user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // if unverified user exists, remove it and re-create
    if (existingUser && !existingUser.isVerified) {
      await User.findByIdAndDelete(existingUser._id);
    }

    // create unverified user
    await User.create({
      name,
      email,
      password,
      role: role || 'member',
      isVerified: false
    });

    // generate and send OTP (non-blocking so response is instant)
    const otp = await createOTP(email, 'register');
    sendOTPEmail(email, otp, 'register').catch(err => console.error('OTP email error:', err.message));

    res.status(200).json({
      message: 'Verification code sent to your email',
      email
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ============================================
// STEP 2: Verify registration OTP
// ============================================
router.post('/verify-register', [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();
    const otp = req.body.otp.trim();

    const result = await verifyOTP(email, otp, 'register');

    if (result === 'expired') {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }
    if (!result) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    // activate the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register again.' });
    }

    user.isVerified = true;
    await user.save();

    // send welcome email (non-blocking so it doesn't delay response)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Welcome email failed:', err.message);
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error('Verify register error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// ============================================
// STEP 1: Login - check credentials & send OTP
// ============================================
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Account not verified. Please register again.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // send login OTP (non-blocking so response is instant)
    const otp = await createOTP(email, 'login');
    sendOTPEmail(email, otp, 'login').catch(err => console.error('OTP email error:', err.message));

    res.json({
      message: 'Verification code sent to your email',
      email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ============================================
// STEP 2: Verify login OTP
// ============================================
router.post('/verify-login', [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();
    const otp = req.body.otp.trim();

    const result = await verifyOTP(email, otp, 'login');

    if (result === 'expired') {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }
    if (!result) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error('Verify login error:', err);
    res.status(500).json({ message: 'Login verification failed' });
  }
});

// ============================================
// Forgot Password - send OTP
// ============================================
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = await createOTP(email, 'reset');
    sendOTPEmail(email, otp, 'reset').catch(err => console.error('OTP email error:', err.message));

    res.json({ message: 'Password reset code sent to your email', email });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
});

// ============================================
// Reset Password - verify OTP & set new password
// ============================================
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit code'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();
    const otp = req.body.otp.trim();
    const { newPassword } = req.body;

    const result = await verifyOTP(email, otp, 'reset');

    if (result === 'expired') {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }
    if (!result) {
      return res.status(400).json({ message: 'Invalid reset code. Please check and try again.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// ============================================
// Resend OTP
// ============================================
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Email is required'),
  body('purpose').isIn(['register', 'login', 'reset']).withMessage('Invalid purpose')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const email = req.body.email.toLowerCase().trim();
    const { purpose } = req.body;
    const otp = await createOTP(email, purpose);
    sendOTPEmail(email, otp, purpose).catch(err => console.error('OTP email error:', err.message));
    res.json({ message: 'A new verification code has been sent to your email' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Failed to resend code' });
  }
});

// GET /api/auth/me - get logged in user info
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

module.exports = router;
