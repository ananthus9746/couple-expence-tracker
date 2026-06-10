const Expense = require('../models/Expense')
const Couple  = require('../models/Couple')

/* ── Helper: verify user belongs to a couple ── */
const getCouple = async (user) => {
  if (!user.coupleId) throw { status: 403, message: 'Join or create a couple first' }
  const couple = await Couple.findById(user.coupleId)
  if (!couple) throw { status: 404, message: 'Couple not found' }
  return couple
}

/* ── Add expense ──────────────────────────────────────────── */
exports.addExpense = async (req, res) => {
  try {
    const couple = await getCouple(req.user)
    const { title, amount, category, paidBy, date, note } = req.body

    const expense = await Expense.create({
      coupleId: couple._id,
      addedBy:  req.user._id,
      title,
      amount,
      category: category || 'other',
      paidBy:   paidBy || req.user.name,
      date:     date ? new Date(date) : new Date(),
      note:     note || '',
    })

    res.status(201).json({ expense })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Get all expenses for couple ──────────────────────────── */
exports.getExpenses = async (req, res) => {
  try {
    const couple = await getCouple(req.user)

    const {
      category,
      paidBy,
      from,
      to,
      page  = 1,
      limit = 50,
      sort  = '-date',
    } = req.query

    const filter = { coupleId: couple._id }

    if (category) filter.category = category
    if (paidBy)   filter.paidBy   = paidBy
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to)   filter.date.$lte = new Date(to)
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Expense.countDocuments(filter)

    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('addedBy', 'name')

    res.json({
      expenses,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Get single expense ───────────────────────────────────── */
exports.getExpense = async (req, res) => {
  try {
    const couple  = await getCouple(req.user)
    const expense = await Expense.findOne({
      _id:      req.params.id,
      coupleId: couple._id,
    }).populate('addedBy', 'name')

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' })
    }
    res.json({ expense })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Update expense ───────────────────────────────────────── */
exports.updateExpense = async (req, res) => {
  try {
    const couple  = await getCouple(req.user)
    const expense = await Expense.findOne({
      _id:      req.params.id,
      coupleId: couple._id,
    })

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' })
    }

    // Only the person who added it can update
    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to edit this expense' })
    }

    const { title, amount, category, paidBy, date, note } = req.body
    if (title)    expense.title    = title
    if (amount)   expense.amount   = amount
    if (category) expense.category = category
    if (paidBy)   expense.paidBy   = paidBy
    if (date)     expense.date     = new Date(date)
    if (note !== undefined) expense.note = note

    await expense.save()
    res.json({ expense })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Delete expense ───────────────────────────────────────── */
exports.deleteExpense = async (req, res) => {
  try {
    const couple  = await getCouple(req.user)
    const expense = await Expense.findOne({
      _id:      req.params.id,
      coupleId: couple._id,
    })

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' })
    }

    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to delete this expense' })
    }

    await expense.deleteOne()
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Get spending summary (by category, by partner) ──────── */
exports.getSummary = async (req, res) => {
  try {
    const couple = await getCouple(req.user)
    const { from, to } = req.query

    const match = { coupleId: couple._id }
    if (from || to) {
      match.date = {}
      if (from) match.date.$gte = new Date(from)
      if (to)   match.date.$lte = new Date(to)
    }

    // By category
    const byCategory = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    // By paidBy
    const byPartner = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$paidBy', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    // Daily totals (for chart)
    const daily = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year:  { $year: '$date' },
            month: { $month: '$date' },
            day:   { $dayOfMonth: '$date' },
          },
          total:  { $sum: '$amount' },
          count:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ])

    res.json({ byCategory, byPartner, daily })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

/* ── Bulk seed (demo data) ────────────────────────────────── */
exports.seedDemo = async (req, res) => {
  try {
    const couple = await getCouple(req.user)

    // Wipe existing
    await Expense.deleteMany({ coupleId: couple._id })

    const { expenses } = req.body   // array from frontend demoSeed.js
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'expenses array is required' })
    }

    const docs = expenses.map((e) => ({
      coupleId: couple._id,
      addedBy:  req.user._id,
      title:    e.title,
      amount:   e.amount,
      category: e.category || 'other',
      paidBy:   e.paidBy,
      date:     e.date ? new Date(`${e.date} ${new Date().getFullYear()}`) : new Date(),
      note:     e.note || '',
    }))

    const created = await Expense.insertMany(docs)
    res.status(201).json({ count: created.length, message: 'Demo data loaded' })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
