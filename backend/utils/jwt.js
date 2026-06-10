const jwt = require('jsonwebtoken')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  })

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      coupleId:   user.coupleId,
      isVerified: user.isVerified,
    },
  })
}

module.exports = { signToken, sendToken }
