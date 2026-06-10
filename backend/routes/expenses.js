const express = require('express')
const router  = express.Router()
const { body } = require('express-validator')

const {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getSummary,
  seedDemo,
} = require('../controllers/expenseController')

const { protect } = require('../middleware/auth')

// All expense routes require auth
router.use(protect)

const expenseValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category').optional().isString(),
  body('paidBy').optional().isString(),
]

// GET  /api/expenses          — list (with filters + pagination)
// POST /api/expenses          — create
router
  .route('/')
  .get(getExpenses)
  .post(expenseValidation, addExpense)

// GET summary / analytics
router.get('/summary', getSummary)

// POST seed demo data
router.post('/seed-demo', seedDemo)

// GET  /api/expenses/:id      — single
// PATCH /api/expenses/:id     — update
// DELETE /api/expenses/:id    — delete
router
  .route('/:id')
  .get(getExpense)
  .patch(updateExpense)
  .delete(deleteExpense)

module.exports = router
