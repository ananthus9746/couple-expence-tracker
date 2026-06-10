const crypto = require('crypto')
const User   = require('../models/User')
const Couple = require('../models/Couple')
const { sendToken }              = require('../utils/jwt')
const { sendOtpEmail, sendPasswordResetEmail, sendInviteEmail } = require('../utils/email')

/* ── helpers ── */
const generateOtp    = () => String(Math.floor(100000 + Math.random() * 900000))
const generateCode   = () => crypto.randomBytes(3).toString('hex').toUpperCase()
const uniqueCode     = async () => {
  let code, exists
  do { code = generateCode(); exists = await Couple.findOne({ inviteCode: code }) }
  while (exists)
  return code
}

/* ══════════════════════════════════════════════════
   REGISTER — step 1
   Accepts: name, email, password, partnerName, partnerEmail
   Creates unverified user, sends OTP
══════════════════════════════════════════════════ */
exports.register = async (req, res) => {
  try {
    const { name, email, password, partnerName, partnerEmail, inviteCode } = req.body

    // When joining via invite code, partner fields are not required
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (!inviteCode && (!partnerName || !partnerEmail)) {
      return res.status(400).json({ message: 'Partner name and email are required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const otp       = generateOtp()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    let user = existing
    if (!user) {
      user = new User({ name, email: email.toLowerCase(), password })
    } else {
      user.name     = name
      user.password = password
    }

    user.otpCode    = otp
    user.otpExpiry  = otpExpiry
    user.pendingPartner = inviteCode
      ? { inviteCode: inviteCode.toUpperCase() }
      : { name: partnerName, email: partnerEmail.toLowerCase() }

    await user.save()
    await sendOtpEmail(email, name, otp)

    res.status(201).json({
      message: `OTP sent to ${email}. Enter it to verify your account.`,
      email,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   VERIFY OTP — step 2
   Accepts: email, otp
   Verifies user, creates OR joins couple, sends invite to partner
══════════════════════════════════════════════════ */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otpCode +otpExpiry +pendingPartner +password')

    if (!user) {
      return res.status(400).json({ message: 'No registration found for this email' })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified. Please log in.' })
    }
    if (!user.otpCode || user.otpCode !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please register again.' })
    }

    user.isVerified = true
    user.otpCode    = undefined
    user.otpExpiry  = undefined

    const partner = user.pendingPartner || {}
    user.pendingPartner = undefined

    // Check if registering to JOIN an existing couple (via invite code)
    const isJoining = partner.inviteCode && partner.inviteCode.length >= 4

    if (isJoining) {
      // Join existing couple
      const couple = await Couple.findOne({ inviteCode: partner.inviteCode.toUpperCase() })
      if (!couple) {
        return res.status(400).json({ message: 'Invalid invite code — couple not found' })
      }
      if (couple.isComplete) {
        // Idempotent — already joined
        if (couple.partnerB?.userId?.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'This couple already has two partners' })
        }
      } else {
        couple.partnerB   = { userId: user._id, name: user.name }
        couple.isComplete = true
        await couple.save()
      }
      user.coupleId = couple._id
    } else {
      // Create new couple and send invite to partner
      const inviteCode = await uniqueCode()
      const couple = await Couple.create({
        name:      `${user.name} & ${partner.name || 'Partner'}`,
        inviteCode,
        partnerA: { userId: user._id, name: user.name },
        partnerB: { userId: null, name: partner.name || null, email: partner.email || null },
      })
      user.coupleId = couple._id

      // Send invite email to partner (non-blocking)
      if (partner.email && !partner.email.startsWith('noreply+')) {
        sendInviteEmail(partner.email, user.name, couple.name, inviteCode)
          .catch(console.error)
      }
    }

    await user.save()
    sendToken(user, 200, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   RESEND OTP
══════════════════════════════════════════════════ */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otpCode +otpExpiry')

    if (!user || user.isVerified) {
      return res.status(400).json({ message: 'No pending verification for this email' })
    }

    const otp   = generateOtp()
    user.otpCode  = otp
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    await user.save({ validateBeforeSave: false })

    await sendOtpEmail(email, user.name, otp)
    res.json({ message: 'New OTP sent' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please complete OTP verification.',
        needsVerification: true,
        email: user.email,
      })
    }

    sendToken(user, 200, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   GET ME
══════════════════════════════════════════════════ */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('coupleId')
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   UPDATE PROFILE
══════════════════════════════════════════════════ */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id, { name }, { new: true, runValidators: true }
    )
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════════════════ */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.json({ message: 'If that email is registered, a reset OTP has been sent.' })

    const otp = generateOtp()
    user.otpCode   = otp
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    await user.save({ validateBeforeSave: false })

    await sendOtpEmail(email, user.name, otp, true)
    res.json({ message: 'If that email is registered, a reset OTP has been sent.', email })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   RESET PASSWORD (via OTP)
══════════════════════════════════════════════════ */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otpCode +otpExpiry')

    if (!user || user.otpCode !== String(otp) || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    user.password  = password
    user.otpCode   = undefined
    user.otpExpiry = undefined
    await user.save()

    sendToken(user, 200, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   CHANGE PASSWORD (authenticated)
══════════════════════════════════════════════════ */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    sendToken(user, 200, res)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   GET INVITE DETAILS
   Accepts: code (via params)
   Returns the email and name that Partner A invited
   by looking up the creator's User document.
══════════════════════════════════════════════════ */
exports.getInviteDetails = async (req, res) => {
  try {
    const { code } = req.params
    if (!code) {
      return res.status(400).json({ message: 'Invite code is required' })
    }

    const couple = await Couple.findOne({ inviteCode: code.toUpperCase() })
    if (!couple) {
      return res.status(404).json({ message: 'Invalid invite code — couple not found' })
    }

    res.json({
      name: couple.partnerB?.name || '',
      email: couple.partnerB?.email || '',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}

/* ══════════════════════════════════════════════════
   JOIN WITH INVITE CODE (Passwordless Login)
   Accepts: inviteCode
   Creates user account if first time joining, or retrieves existing,
   returns JWT token to automatically log the partner in.
══════════════════════════════════════════════════ */
exports.joinWithCode = async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' })
    }

    const couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase() })
    if (!couple) {
      return res.status(404).json({ message: 'Invalid invite code' })
    }

    let user;
    if (!couple.partnerB.userId) {
      // First time joining — create user account for Partner B
      const email = couple.partnerB.email || `partner_${inviteCode.toLowerCase()}@theduel.com`
      const name = couple.partnerB.name || 'Partner'
      
      let existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        if (!existingUser.coupleId) {
          existingUser.coupleId = couple._id
          await existingUser.save()
        }
        user = existingUser
      } else {
        const crypto = require('crypto')
        const randomPassword = crypto.randomBytes(16).toString('hex')
        user = new User({
          name,
          email: email.toLowerCase(),
          password: randomPassword,
          isVerified: true,
          coupleId: couple._id,
        })
        await user.save()
      }

      couple.partnerB.userId = user._id
      couple.partnerB.name = user.name
      couple.isComplete = true
      await couple.save()
    } else {
      user = await User.findById(couple.partnerB.userId)
      if (!user) {
        return res.status(404).json({ message: 'Invited partner account not found' })
      }
    }

    sendToken(user, 200, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}
