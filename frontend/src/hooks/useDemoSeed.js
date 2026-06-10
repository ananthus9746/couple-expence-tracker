import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpense } from '../context/ExpenseContext'
import { DEMO_COUPLE, DEMO_USER, DEMO_EXPENSES } from '../data/demoSeed'

/**
 * useDemoSeed
 * -----------
 * Mimics an async API call: shows a loading state for ~1.2 s,
 * then atomically seeds the store and navigates to /dashboard.
 *
 * Returns:
 *   seedDemo()   – kick off the seeding flow
 *   isSeeded     – true when demo data is already loaded
 *   isLoading    – true while the fake API fetch is in progress
 */
export const useDemoSeed = () => {
  const { dispatch, state } = useExpense()
  const navigate  = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const seededRef  = useRef(false)

  const isSeeded = state.couple?.id === 'DEMO01'

  // Watch: once the store has the demo couple, navigate.
  // This runs *after* the state update + localStorage write, avoiding the race.
  useEffect(() => {
    if (seededRef.current && state.couple?.id === 'DEMO01') {
      seededRef.current = false
      setIsLoading(false)
      navigate('/dashboard', { replace: true })
    }
  }, [state.couple, navigate])

  const seedDemo = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    seededRef.current = true

    // Simulate network latency (800 – 1 400 ms)
    const delay = 800 + Math.random() * 600

    setTimeout(() => {
      dispatch({
        type: 'SEED_DEMO',
        payload: {
          couple:   DEMO_COUPLE,
          user:     DEMO_USER,
          expenses: DEMO_EXPENSES,
        },
      })
      // navigation happens in the useEffect above once state updates
    }, delay)
  }, [dispatch, isLoading])

  return { seedDemo, isSeeded, isLoading }
}
