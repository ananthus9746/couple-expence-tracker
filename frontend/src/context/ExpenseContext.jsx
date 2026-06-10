import { createContext, useContext, useReducer, useEffect } from 'react'

// ── Initial state ──────────────────────────────────────────────
const INITIAL_STATE = {
  couple: null,            // { id, name, partnerA, partnerB }
  user: null,              // { name, avatar }
  expenses: [],            // { id, title, amount, category, paidBy, date, note }
}

// ── Reducer ────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_COUPLE':
      return { ...state, couple: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] }
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) }
    case 'SEED_DEMO':
      return {
        couple:   action.payload.couple,
        user:     action.payload.user,
        expenses: action.payload.expenses,
      }
    case 'HYDRATE':
      return { ...state, ...action.payload }
    case 'RESET':
      return INITIAL_STATE
    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────
const ExpenseContext = createContext(null)

export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    try {
      const saved = localStorage.getItem('duel-state')
      return saved ? { ...init, ...JSON.parse(saved) } : init
    } catch {
      return init
    }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('duel-state', JSON.stringify(state))
  }, [state])

  // Derived stats
  const stats = (() => {
    const partnerA = state.couple?.partnerA || 'Partner A'
    const partnerB = state.couple?.partnerB || 'Partner B'
    const aTotal = state.expenses
      .filter((e) => e.paidBy === partnerA)
      .reduce((sum, e) => sum + e.amount, 0)
    const bTotal = state.expenses
      .filter((e) => e.paidBy === partnerB)
      .reduce((sum, e) => sum + e.amount, 0)
    const total = aTotal + bTotal
    const aPercent = total ? Math.round((aTotal / total) * 100) : 0
    const bPercent = total ? Math.round((bTotal / total) * 100) : 0
    return { partnerA, partnerB, aTotal, bTotal, total, aPercent, bPercent }
  })()

  return (
    <ExpenseContext.Provider value={{ state, dispatch, stats }}>
      {children}
    </ExpenseContext.Provider>
  )
}

export const useExpense = () => {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpense must be used within ExpenseProvider')
  return ctx
}
