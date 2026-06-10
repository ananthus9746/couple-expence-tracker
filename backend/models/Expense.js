const mongoose = require('mongoose')

const VALID_CATEGORIES = [
  'food', 'groceries', 'shopping', 'bills', 'emi',
  'petrol', 'car', 'transport', 'home', 'college',
  'health', 'entertainment', 'dining', 'other',
]

const expenseSchema = new mongoose.Schema(
  {
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      required: true,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: VALID_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    paidBy: {
      type: String,
      required: [true, 'paidBy is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Note cannot exceed 300 characters'],
      default: '',
    },
  },
  { timestamps: true }
)

// Index for fast per-couple queries sorted by date
expenseSchema.index({ coupleId: 1, date: -1 })

module.exports = mongoose.model('Expense', expenseSchema)
