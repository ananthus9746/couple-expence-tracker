const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Couple',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode:           { type: String,  select: false },
    otpExpiry:         { type: Date,    select: false },
    pendingPartner:    {
      type: {
        name:  String,
        email: String,
        inviteCode: String,
      },
      select: false,
      default: undefined,
    },
    resetToken:        { type: String,  select: false },
    resetTokenExpiry:  { type: Date,    select: false },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare entered password with hashed
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('User', userSchema)
