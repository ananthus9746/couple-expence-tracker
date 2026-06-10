const mongoose = require('mongoose')

const coupleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Couple name is required'],
      trim: true,
      maxlength: [80, 'Couple name cannot exceed 80 characters'],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    partnerA: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name:   { type: String, required: true },
    },
    partnerB: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name:   { type: String, default: null },
      email:  { type: String, default: null },
    },
    isComplete: {
      type: Boolean,
      default: false, // becomes true when both partners have joined
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Couple', coupleSchema)
