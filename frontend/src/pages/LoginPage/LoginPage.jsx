import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import Icon from '../../components/Icon/Icon'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useExpense } from '../../context/ExpenseContext'
import { auth as authApi, couples as couplesApi } from '../../services/api'
import { couplePayload } from '../../utils/couplePayload'
import styles from './LoginPage.module.css'

const LoginPage = () => {
  const navigate               = useNavigate()
  const { login }              = useAuth()
  const { dispatch }           = useExpense()
  const { theme, toggleTheme } = useTheme()

  const queryCode = new URLSearchParams(window.location.search).get('code') || ''

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [inviteCode, setInviteCode] = useState(queryCode)
  const [errors,     setErrors]     = useState({})
  const [loading,    setLoading]    = useState(false)
  const [apiError,   setApiError]   = useState('')

  useEffect(() => {
    if (!inviteCode) return

    authApi.getInviteDetails(inviteCode)
      .then((data) => {
        if (data.email) {
          setEmail(data.email)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch invite details:', err)
      })
  }, [inviteCode])

  const validate = () => {
    const e = {}
    if (!email.trim())    e.email    = 'Email is required'
    if (!password.trim()) e.password = 'Password is required'
    if (inviteCode.trim() && inviteCode.trim().length < 4) {
      e.inviteCode = 'Please enter a valid invite code'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      const data = await login({ email, password })

      let coupleToSet = null
      let userCoupleId = data.user.coupleId

      if (inviteCode.trim() && !userCoupleId) {
        try {
          const { couple } = await couplesApi.join({
            inviteCode: inviteCode.trim().toUpperCase(),
            partnerBName: data.user.name,
          })
          coupleToSet = couple
          userCoupleId = couple._id
          data.user.coupleId = couple._id
        } catch (err) {
          console.error('Auto-join failed:', err)
        }
      }

      if (userCoupleId) {
        // Fetch & hydrate couple BEFORE navigating so ProtectedRoute
        // finds state.couple already populated — no race condition
        try {
          const couple = coupleToSet || (await couplesApi.getMe()).couple
          dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
          dispatch({ type: 'SET_USER',   payload: { name: data.user.name } })
        } catch { /* couple fetch failed — CoupleLoader will retry */ }
        navigate('/dashboard')
      } else {
        navigate('/profile')
      }
    } catch (err) {
      setApiError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      {/* Theme toggle — top right corner */}
      <button
        type="button"
        className={styles.themeBtn}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={20} />
      </button>

      <div className={styles.header}>
        <div className={styles.logo}>
          <Icon name="bolt" size={32} style={{ color: 'var(--color-partner-a)' }} />
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to The Duel 💸</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <InputField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
          error={errors.email}
          leadingIcon="mail"
          autoFocus
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
          leadingIcon="lock"
        />

        <InputField
          label="Invite Code (Optional)"
          placeholder="e.g. A3F9B2"
          value={inviteCode}
          onChange={(e) => { setInviteCode(e.target.value.toUpperCase().slice(0, 8)); setErrors((p) => ({ ...p, inviteCode: '' })) }}
          error={errors.inviteCode}
          leadingIcon="key"
          maxLength={8}
          style={{ letterSpacing: '0.15em', fontWeight: 700 }}
        />

        {apiError && (
          <div className={styles.apiError} role="alert">
            <Icon name="error" size={16} />
            {apiError}
          </div>
        )}

        <div className={styles.forgotRow}>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to={inviteCode.trim() ? `/register?code=${inviteCode.trim()}` : "/register"} className={styles.switchLink}>Create one</Link>
        </p>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        <Link to="/join" className={styles.inviteBtn}>
          <Icon name="key" size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span>Have an invite code? <strong>Join here</strong></span>
          <Icon name="chevron_right" size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
        </Link>
      </form>
    </PageShell>
  )
}

export default LoginPage
