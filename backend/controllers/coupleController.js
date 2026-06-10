const crypto  = require('crypto')
const Couple  = require('../models/Couple')
const User    = require('../models/User')
const Expense = require('../models/Expense')
const { sendInviteEmail } = require('../utils/email')

/* ── Generate unique 6-char invite code ── */
const makeCode = () => crypto.randomBytes(3).toString('hex').toUpperCase()

const uniqueCode = async () => {
  let code, exists
  do {
    code   = makeCode()
    exists = await Couple.findOne({ inviteCode: code })
  } while (exists)
  return code
}

/* ── Create couple ────────────────────────────────────────── */
exports.createCouple = async (req, res) => {
  try {
    const { name, partnerAName, partnerBName } = req.body

    if (req.user.coupleId) {
      return res.status(400).json({ message: 'You already belong to a couple' })
    }

    const inviteCode = await uniqueCode()

    const couple = await Couple.create({
      name:       name || `${partnerAName}'s Couple`,
      inviteCode,
      partnerA: {
        userId: req.user._id,
        name:   partnerAName || req.user.name,
      },
      partnerB: {
        userId: null,
        name:   partnerBName || null,
        email:  null,
      },
    })

    // Link user → couple
    await User.findByIdAndUpdate(req.user._id, { coupleId: couple._id })

    res.status(201).json({ couple })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Join couple by invite code ───────────────────────────── */
exports.joinCouple = async (req, res) => {
  try {
    const { inviteCode, partnerBName } = req.body

    const couple = await Couple.findOne({ inviteCode: inviteCode.toUpperCase() })
    if (!couple) {
      return res.status(404).json({ message: 'Invalid invite code' })
    }

    // If user already belongs to THIS couple, just return it (idempotent join)
    if (req.user.coupleId && req.user.coupleId.toString() === couple._id.toString()) {
      return res.json({ couple, alreadyJoined: true })
    }

    // If user belongs to a DIFFERENT couple, check if it's an incomplete dummy couple
    if (req.user.coupleId) {
      const userCouple = await Couple.findById(req.user.coupleId)
      if (userCouple && !userCouple.isComplete) {
        // Safe to discard this incomplete dummy couple
        await User.findByIdAndUpdate(req.user._id, { coupleId: null })
        req.user.coupleId = null
        await Expense.deleteMany({ coupleId: userCouple._id })
        await userCouple.deleteOne()
      } else {
        return res.status(400).json({ message: 'You already belong to a different active couple' })
      }
    }

    if (couple.isComplete) {
      // If this user IS already partner B, treat as idempotent — just return the couple
      if (
        couple.partnerB?.userId &&
        couple.partnerB.userId.toString() === req.user._id.toString()
      ) {
        return res.json({ couple, alreadyJoined: true })
      }
      return res.status(400).json({ message: 'This couple already has two partners' })
    }

    // Can't join your own couple as partner B
    if (couple.partnerA.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot join your own couple' })
    }

    couple.partnerB   = { userId: req.user._id, name: partnerBName || req.user.name }
    couple.isComplete = true
    await couple.save()

    await User.findByIdAndUpdate(req.user._id, { coupleId: couple._id })

    res.json({ couple })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Get my couple ────────────────────────────────────────── */
exports.getMyCouple = async (req, res) => {
  try {
    if (!req.user.coupleId) {
      return res.status(404).json({ message: 'You are not in a couple yet' })
    }

    const couple = await Couple.findById(req.user.coupleId)
      .populate('partnerA.userId', 'name email')
      .populate('partnerB.userId', 'name email')

    if (!couple) {
      return res.status(404).json({ message: 'Couple not found' })
    }

    res.json({ couple })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Update couple name ───────────────────────────────────── */
exports.updateCouple = async (req, res) => {
  try {
    const { name } = req.body
    if (!req.user.coupleId) {
      return res.status(404).json({ message: 'You are not in a couple' })
    }

    const couple = await Couple.findByIdAndUpdate(
      req.user.coupleId,
      { name },
      { new: true, runValidators: true }
    )
    res.json({ couple })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Send invite email to partner ────────────────────────── */
exports.sendInvite = async (req, res) => {
  try {
    const { email } = req.body
    if (!req.user.coupleId) {
      return res.status(400).json({ message: 'Create a couple first' })
    }

    const couple = await Couple.findById(req.user.coupleId)
    await sendInviteEmail(email, req.user.name, couple.name, couple.inviteCode)

    res.json({ message: `Invite sent to ${email}` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Leave / delete couple ────────────────────────────────── */
exports.leaveCouple = async (req, res) => {
  try {
    if (!req.user.coupleId) {
      return res.status(400).json({ message: 'You are not in a couple' })
    }

    const couple = await Couple.findById(req.user.coupleId)

    // Remove both partners from couple link
    await User.updateMany(
      { coupleId: couple._id },
      { coupleId: null }
    )

    // Delete all expenses for this couple
    await Expense.deleteMany({ coupleId: couple._id })

    // Delete the couple
    await couple.deleteOne()

    res.json({ message: 'Left couple and deleted all data' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ── Get couple stats ─────────────────────────────────────── */
exports.getCoupleStats = async (req, res) => {
  try {
    if (!req.user.coupleId) {
      return res.status(404).json({ message: 'Not in a couple' })
    }

    const couple = await Couple.findById(req.user.coupleId)

    const expenses = await Expense.find({ coupleId: couple._id })

    const aName  = couple.partnerA.name
    const bName  = couple.partnerB?.name || 'Partner B'

    const aTotal = expenses.filter(e => e.paidBy === aName).reduce((s, e) => s + e.amount, 0)
    const bTotal = expenses.filter(e => e.paidBy === bName).reduce((s, e) => s + e.amount, 0)
    const total  = aTotal + bTotal

    res.json({
      partnerA:  aName,
      partnerB:  bName,
      aTotal,
      bTotal,
      total,
      aPercent:  total ? Math.round((aTotal / total) * 100) : 0,
      bPercent:  total ? Math.round((bTotal / total) * 100) : 0,
      count:     expenses.length,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
