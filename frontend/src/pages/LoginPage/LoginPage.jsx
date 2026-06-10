import { useState, useEffect, useRef } from 'react'
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

const StepOtp = ({ email, onVerified, onBack }) => {
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [apiError, setApiError]   = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setApiError('')
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setApiError('Enter all 6 digits'); return }

    setLoading(true)
    setApiError('')
    try {
      const data = await authApi.verifyOtp({ email, otp: code })
      onVerified(data)
    } catch (err) {
      setApiError(err.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await authApi.resendOtp(email)
      setResendMsg('New OTP sent!')
      setCountdown(60)
    } catch (err) {
      setResendMsg(err.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.otpIcon}>
          <Icon name="mark_email_read" size={32} style={{ color: 'var(--color-partner-a)' }} />
        </div>
        <h1 className={styles.title}>Verify email</h1>
        <p className={styles.subtitle}>
          Your account is not verified yet.<br />
          We sent a 6-digit code to<br />
          <strong style={{ color: 'var(--color-on-surface)' }}>{email}</strong>
        </p>
      </div>

      <div className={styles.otpForm}>
        <div className={styles.otpBoxes} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              className={[styles.otpBox, digit ? styles.otpBoxFilled : ''].filter(Boolean).join(' ')}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {apiError && (
          <div className={styles.apiError} role="alert">
            <Icon name="error" size={16} />
            {apiError}
          </div>
        )}

        {resendMsg && (
          <p className={styles.resendMsg}>{resendMsg}</p>
        )}

        <Button variant="primary" disabled={loading} onClick={handleVerify}>
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </Button>

        <div className={styles.resendRow}>
          {countdown > 0 ? (
            <span className={styles.resendTimer}>Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </div>

        <p className={styles.switchText}>
          <button
            type="button"
            onClick={onBack}
            className={styles.switchLink}
            style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            Back to sign in
          </button>
        </p>
      </div>
    </>
  )
}

const LoginPage = () => {
  const navigate               = useNavigate()
  const { login, setUser }     = useAuth()
  const { dispatch }           = useExpense()
  const { theme, toggleTheme } = useTheme()

  const queryCode = new URLSearchParams(window.location.search).get('code') || ''

  const [step,       setStep]       = useState('login')
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
    return e
  }

  const handleOtpVerified = async (data) => {
    localStorage.setItem('duel-token', data.token)
    setUser(data.user)

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
      try {
        const couple = coupleToSet || (await couplesApi.getMe()).couple
        dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
        dispatch({ type: 'SET_USER',   payload: { name: data.user.name } })
      } catch { /* couple fetch failed — CoupleLoader will retry */ }
      navigate('/dashboard')
    } else {
      navigate('/profile')
    }
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
      if (err.status === 403) {
        setStep('otp')
      } else {
        setApiError(err.message || 'Login failed')
      }
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

      {step === 'login' ? (
        <>
          <div className={styles.header}>
            <div className={styles.logo}>
              <img src="/apple-touch-icon.png" alt="The Duel Logo" className={styles.logoImg} />
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
              <div className={styles.inviteIconBox}>
                <Icon name="key" size={20} filled />
              </div>
              <div className={styles.inviteText}>
                <span className={styles.inviteLabel}>Have an invite code?</span>
                <span className={styles.inviteAction}>Join here</span>
              </div>
              <Icon name="chevron_right" size={20} className={styles.arrowIcon} />
            </Link>
          </form>
        </>
      ) : (
        <StepOtp
          email={email}
          onVerified={handleOtpVerified}
          onBack={() => {
            setStep('login')
            setApiError('')
          }}
        />
      )}
    </PageShell>
  )
}

export default LoginPage
