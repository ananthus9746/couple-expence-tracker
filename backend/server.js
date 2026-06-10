const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')
require('dotenv').config()

const authRoutes    = require('./routes/auth')
const coupleRoutes  = require('./routes/couples')
const expenseRoutes = require('./routes/expenses')

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & Middleware ──────────────────────────────────────
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/couples', coupleRoutes)
app.use('/api/expenses', expenseRoutes)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

// ── Connect to MongoDB then start ─────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  })
