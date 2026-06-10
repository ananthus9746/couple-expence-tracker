/**
 * demoSeed.js
 * -----------
 * Realistic demo dataset for "The Duel" couple expense tracker.
 * Spread across the current month so the trend chart and insights
 * all have meaningful data to render.
 */

// Spread dates across the current month (weeks 1-4)
const now   = new Date()
const year  = now.getFullYear()
const month = now.toLocaleString('en-US', { month: 'short' }) // e.g. "Jun"

const d = (day) => `${month} ${day}`   // e.g. "Jun 3"

export const DEMO_COUPLE = {
  id:       'DEMO01',
  name:     'Alex & Jordan',
  partnerA: 'Alex',
  partnerB: 'Jordan',
}

export const DEMO_USER = { name: 'Alex' }

export const DEMO_EXPENSES = [
  // ── Week 1 ──────────────────────────────────
  {
    id: 'demo-01',
    title: 'Grocery Run',
    amount: 84.50,
    category: 'food',
    paidBy: 'Alex',
    date: d(2),
    note: 'Weekly staples from Whole Foods',
  },
  {
    id: 'demo-02',
    title: 'Electricity Bill',
    amount: 112.00,
    category: 'bills',
    paidBy: 'Jordan',
    date: d(3),
    note: 'Monthly utility',
  },
  {
    id: 'demo-03',
    title: 'Uber to Airport',
    amount: 34.20,
    category: 'transport',
    paidBy: 'Alex',
    date: d(4),
    note: '',
  },
  {
    id: 'demo-04',
    title: 'Netflix',
    amount: 15.99,
    category: 'entertainment',
    paidBy: 'Jordan',
    date: d(5),
    note: 'Streaming subscription',
  },
  {
    id: 'demo-05',
    title: 'Dinner Date',
    amount: 92.00,
    category: 'food',
    paidBy: 'Alex',
    date: d(6),
    note: 'Sushi at Nobu',
  },
  {
    id: 'demo-06',
    title: 'New Sneakers',
    amount: 129.99,
    category: 'shopping',
    paidBy: 'Jordan',
    date: d(7),
    note: 'Nike Air Max',
  },

  // ── Week 2 ──────────────────────────────────
  {
    id: 'demo-07',
    title: 'Pharmacy',
    amount: 28.75,
    category: 'health',
    paidBy: 'Alex',
    date: d(9),
    note: 'Cold medicine',
  },
  {
    id: 'demo-08',
    title: 'Spotify',
    amount: 10.99,
    category: 'entertainment',
    paidBy: 'Alex',
    date: d(10),
    note: 'Music streaming',
  },
  {
    id: 'demo-09',
    title: 'Lunch Takeout',
    amount: 22.40,
    category: 'food',
    paidBy: 'Jordan',
    date: d(11),
    note: 'Thai place near office',
  },
  {
    id: 'demo-10',
    title: 'Fuel Refill',
    amount: 58.00,
    category: 'transport',
    paidBy: 'Jordan',
    date: d(12),
    note: 'Shell station',
  },
  {
    id: 'demo-11',
    title: 'Amazon Order',
    amount: 47.99,
    category: 'shopping',
    paidBy: 'Alex',
    date: d(13),
    note: 'Kitchen gadgets',
  },
  {
    id: 'demo-12',
    title: 'Weekend Brunch',
    amount: 54.00,
    category: 'food',
    paidBy: 'Alex',
    date: d(14),
    note: 'Egg & Dart café',
  },

  // ── Week 3 ──────────────────────────────────
  {
    id: 'demo-13',
    title: 'Internet Bill',
    amount: 79.00,
    category: 'bills',
    paidBy: 'Alex',
    date: d(16),
    note: 'Monthly ISP',
  },
  {
    id: 'demo-14',
    title: 'Gym Membership',
    amount: 45.00,
    category: 'health',
    paidBy: 'Jordan',
    date: d(17),
    note: 'Monthly plan',
  },
  {
    id: 'demo-15',
    title: 'Movie Night',
    amount: 31.50,
    category: 'entertainment',
    paidBy: 'Jordan',
    date: d(18),
    note: 'Cinema + popcorn',
  },
  {
    id: 'demo-16',
    title: 'Coffee & Pastry',
    amount: 18.60,
    category: 'food',
    paidBy: 'Jordan',
    date: d(19),
    note: 'Morning ritual ☕',
  },
  {
    id: 'demo-17',
    title: 'Metro Card Top-Up',
    amount: 40.00,
    category: 'transport',
    paidBy: 'Alex',
    date: d(20),
    note: '',
  },
  {
    id: 'demo-18',
    title: 'Clothing Haul',
    amount: 198.00,
    category: 'shopping',
    paidBy: 'Jordan',
    date: d(21),
    note: 'H&M sale',
  },

  // ── Week 4 ──────────────────────────────────
  {
    id: 'demo-19',
    title: 'Doctor Visit',
    amount: 60.00,
    category: 'health',
    paidBy: 'Alex',
    date: d(23),
    note: 'Annual checkup',
  },
  {
    id: 'demo-20',
    title: 'Grocery Run',
    amount: 96.30,
    category: 'food',
    paidBy: 'Jordan',
    date: d(24),
    note: 'Costco haul',
  },
  {
    id: 'demo-21',
    title: 'Streaming Bundle',
    amount: 22.99,
    category: 'entertainment',
    paidBy: 'Alex',
    date: d(25),
    note: 'Disney+ & Hulu',
  },
  {
    id: 'demo-22',
    title: 'Parking Fine 😬',
    amount: 65.00,
    category: 'other',
    paidBy: 'Alex',
    date: d(26),
    note: 'Oops',
  },
  {
    id: 'demo-23',
    title: 'Taxi Home',
    amount: 19.80,
    category: 'transport',
    paidBy: 'Jordan',
    date: d(27),
    note: 'Late night',
  },
  {
    id: 'demo-24',
    title: 'Birthday Dinner',
    amount: 145.00,
    category: 'food',
    paidBy: 'Alex',
    date: d(28),
    note: "Jordan's birthday 🎂",
  },
  {
    id: 'demo-25',
    title: 'Water Bill',
    amount: 35.00,
    category: 'bills',
    paidBy: 'Jordan',
    date: d(29),
    note: '',
  },
]
