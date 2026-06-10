import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ExpenseProvider, useExpense } from './context/ExpenseContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { couples } from './services/api'
import { couplePayload } from './utils/couplePayload'
import AppLoader        from './components/AppLoader/AppLoader'
import LoginPage        from './pages/LoginPage/LoginPage'
import RegisterPage     from './pages/RegisterPage/RegisterPage'
import JoinCouplePage   from './pages/JoinCouplePage/JoinCouplePage'
import DashboardPage    from './pages/DashboardPage/DashboardPage'
import AddExpensePage   from './pages/AddExpensePage/AddExpensePage'
import HistoryPage      from './pages/HistoryPage/HistoryPage'
import InsightsPage     from './pages/InsightsPage/InsightsPage'
import ProfilePage      from './pages/ProfilePage/ProfilePage'
import CreateCouplePage   from './pages/CreateCouplePage/CreateCouplePage'
import InstallPWA        from './components/InstallPWA/InstallPWA'



/* ══════════════════════════════════════════════════
   CoupleLoader
   Waits for auth + hydrates couple state from API
   before rendering any routes.
══════════════════════════════════════════════════ */
const CoupleLoader = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const { state, dispatch }             = useExpense()
  const [coupleLoading, setCoupleLoading] = useState(false)
  const [coupleChecked, setCoupleChecked] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.coupleId) {
      setCoupleChecked(true)
      return
    }

    if (state.couple) {
      setCoupleChecked(true)
      return
    }

    setCoupleLoading(true)
    couples.getMe()
      .then(({ couple }) => {
        dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
        dispatch({ type: 'SET_USER',   payload: { name: user.name } })
      })
      .catch(() => {})
      .finally(() => {
        setCoupleLoading(false)
        setCoupleChecked(true)
      })
  }, [user, authLoading, state.couple]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || coupleLoading || (!coupleChecked && user?.coupleId)) {
    return <AppLoader />
  }

  return children
}

/* ── Requires logged-in user WITH a couple ── */
const ProtectedRoute = ({ children }) => {
  const { state }         = useExpense()
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!user)   return <Navigate to="/login" replace />
  // If user has a coupleId but local state hasn't loaded yet — wait for CoupleLoader
  if (!state.couple && user.coupleId) return <AppLoader />
  // User has no couple at all — send to profile to set one up
  if (!state.couple) return <Navigate to="/profile" replace />
  return children
}

/* ── Guest only — logged-in users go to dashboard/profile ── */
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (user) {
    return user.coupleId 
      ? <Navigate to="/dashboard" replace /> 
      : <Navigate to="/profile" replace />
  }
  return children
}

/* ── Requires login but user might not have a couple yet ── */
const CoupleSetupRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

const AppRoutes = () => (
  <Routes>
    {/* Default — redirect to login */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Guest only */}
    <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

    {/* Invite code join — accessible without login */}
    <Route path="/join"   element={<JoinCouplePage />} />

    {/* /create redirects to profile */}
    <Route path="/create" element={<Navigate to="/profile" replace />} />

    {/* Protected — needs couple */}
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/add"       element={<ProtectedRoute><AddExpensePage /></ProtectedRoute>} />
    <Route path="/history"   element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    <Route path="/insights"  element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
    
    {/* Profile — only requires login, not couple */}
    <Route path="/profile"   element={<CoupleSetupRoute><ProfilePage /></CoupleSetupRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <ExpenseProvider>
          <CoupleLoader>
            <AppRoutes />
            <InstallPWA />
          </CoupleLoader>
        </ExpenseProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
)

export default App
