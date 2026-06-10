const express = require('express')
const router  = express.Router()
const { body } = require('express-validator')
const rateLimit = require('express-rate-limit')

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  getInviteDetails,
  joinWithCode,
} = require('../controllers/authController')

const { protect } = require('../middleware/auth')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development testing
  message: { message: 'Too many requests, please try again later.' },
})

// ── Public ──────────────────────────────────────────────────

// GET /api/auth/invite-details/:code
router.get('/invite-details/:code', authLimiter, getInviteDetails)

// POST /api/auth/join-with-code
router.post('/join-with-code', authLimiter, joinWithCode)

// POST /api/auth/register  — step 1: create user + send OTP
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Min 6 characters'),
  body('partnerName').trim().notEmpty().withMessage('Partner name is required'),
  body('partnerEmail').isEmail().normalizeEmail().withMessage('Valid partner email required'),
], register)

// POST /api/auth/verify-otp  — step 2: verify + create couple
router.post('/verify-otp', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], verifyOtp)

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, [
  body('email').isEmail().normalizeEmail(),
], resendOtp)

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login)

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPassword)

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, resetPassword)

// ── Protected ───────────────────────────────────────────────

router.get('/me',              protect, getMe)
router.patch('/me',            protect, updateProfile)
router.post('/change-password', protect, changePassword)

module.exports = router
