const express = require('express')
const router  = express.Router()
const { body } = require('express-validator')

const {
  createCouple,
  joinCouple,
  getMyCouple,
  updateCouple,
  sendInvite,
  leaveCouple,
  getCoupleStats,
} = require('../controllers/coupleController')

const { protect } = require('../middleware/auth')

// All couple routes require auth
router.use(protect)

// POST /api/couples/create
router.post(
  '/create',
  [
    body('partnerAName').trim().notEmpty().withMessage('Your name is required'),
  ],
  createCouple
)

// POST /api/couples/join
router.post(
  '/join',
  [
    body('inviteCode').trim().notEmpty().withMessage('Invite code is required'),
    body('partnerBName').trim().notEmpty().withMessage('Your name is required'),
  ],
  joinCouple
)

// GET /api/couples/me
router.get('/me', getMyCouple)

// PATCH /api/couples/me
router.patch('/me', updateCouple)

// GET /api/couples/stats
router.get('/stats', getCoupleStats)

// POST /api/couples/invite
router.post(
  '/invite',
  [body('email').isEmail().withMessage('Valid email required').normalizeEmail()],
  sendInvite
)

// DELETE /api/couples/leave
router.delete('/leave', leaveCouple)

module.exports = router
