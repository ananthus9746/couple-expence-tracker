import { useState, useRef, useEffect } from 'react'
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
import styles from './RegisterPage.module.css'

/* ══════════════════════════════════════════
   STEP 1 — Registration details
══════════════════════════════════════════ */
const StepDetails = ({ onOtpSent, themeBtn, inviteCode = '' }) => {
  const hasInviteCode = Boolean(inviteCode)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    partnerName: '', partnerEmail: '',
    inviteCode: inviteCode,
  })

  useEffect(() => {
    if (!inviteCode) return

    authApi.getInviteDetails(inviteCode)
      .then((data) => {
        setForm((p) => ({
          ...p,
          name: data.name || p.name,
          email: data.email || p.email,
        }))
      })
      .catch((err) => {
        console.error('Failed to fetch invite details:', err)
      })
  }, [inviteCode])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name     = 'Your name is required'
    if (!form.email.trim())       e.email    = 'Email is required'
    if (form.password.length < 6) e.password = 'Min 6 characters'
    if (!hasInviteCode) {
      // Creating couple — need partner details
      if (!form.partnerName.trim())  e.partnerName  = 'Partner name is required'
      if (!form.partnerEmail.trim()) e.partnerEmail = 'Partner email is required'
      else if (!/^\S+@\S+\.\S+$/.test(form.partnerEmail)) e.partnerEmail = 'Enter a valid email'
      if (form.email.toLowerCase() === form.partnerEmail.toLowerCase())
        e.partnerEmail = 'Partner email must be different from yours'
    }
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      if (hasInviteCode) {
        // Joining existing couple — register with invite code
        await authApi.register({
          name:        form.name.trim(),
          email:       form.email.trim().toLowerCase(),
          password:    form.password,
          inviteCode:  form.inviteCode.toUpperCase(),
        })
      } else {
        // Creating new couple
        await authApi.register({
          name:         form.name.trim(),
          email:        form.email.trim().toLowerCase(),
          password:     form.password,
          partnerName:  form.partnerName.trim(),
          partnerEmail: form.partnerEmail.trim().toLowerCase(),
        })
      }
      onOtpSent(form.email.trim().toLowerCase())
    } catch (err) {
      setApiError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {themeBtn}
      <div className={styles.header}>
        <div className={styles.logo}>
          <Icon name={hasInviteCode ? 'key' : 'favorite'} size={28} style={{ color: 'var(--color-partner-a)' }} />
        </div>
        <h1 className={styles.title}>{hasInviteCode ? 'Join your couple' : 'Create account'}</h1>
        <p className={styles.subtitle}>
          {hasInviteCode ? 'Create your account to join the couple' : 'Start tracking together 💸'}
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>

        {/* Invite code banner */}
        {hasInviteCode && (
          <div className={styles.inviteBanner}>
            <Icon name="key" size={16} style={{ color: 'var(--color-partner-a)', flexShrink: 0 }} />
            <span>Joining with code <strong>{inviteCode}</strong></span>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <p className={styles.fieldGroupLabel}>Your details</p>
          <InputField label="Your name"  placeholder="Alex"             value={form.name}     onChange={set('name')}     error={errors.name}     leadingIcon="person" autoFocus />
          <InputField label="Email"      type="email" placeholder="you@example.com" value={form.email}    onChange={set('email')}    error={errors.email}    leadingIcon="mail" />
          <InputField label="Password"   type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} error={errors.password} leadingIcon="lock" />
        </div>

        {/* Partner fields only shown when creating a new couple */}
        {!hasInviteCode && (
          <div className={styles.fieldGroup}>
            <p className={styles.fieldGroupLabel}>Your partner</p>
            <p className={styles.fieldGroupSub}>We'll send them an invite code to join.</p>
            <InputField label="Partner's name"  placeholder="Jordan"               value={form.partnerName}  onChange={set('partnerName')}  error={errors.partnerName}  leadingIcon="favorite" />
            <InputField label="Partner's email" type="email" placeholder="partner@example.com" value={form.partnerEmail} onChange={set('partnerEmail')} error={errors.partnerEmail} leadingIcon="mail" />
          </div>
        )}

        {apiError && (
          <div className={styles.apiError} role="alert">
            <Icon name="error" size={16} />
            {apiError}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Sending OTP…' : 'Continue'}
        </Button>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to={inviteCode ? `/login?code=${inviteCode}` : "/login"} className={styles.switchLink}>Sign in</Link>
        </p>
      </form>
    </>
  )
}

/* ══════════════════════════════════════════
   STEP 2 — OTP verification
══════════════════════════════════════════ */
const StepOtp = ({ email, onVerified, themeBtn }) => {
  const { refreshUser } = useAuth()
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [apiError, setApiError]   = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])

  // Countdown timer for resend
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
      // token already set by AuthContext via verifyOtp — but we call onVerified with data
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
      {themeBtn}
      <div className={styles.header}>
        <div className={styles.otpIcon}>
          <Icon name="mark_email_read" size={32} style={{ color: 'var(--color-partner-a)' }} />
        </div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
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
          {loading ? 'Verifying…' : 'Verify & Create Account'}
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

        <p className={styles.otpNote}>
          <Icon name="info" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Code expires in 10 minutes. Also check your spam folder.
        </p>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
const RegisterPage = () => {
  const navigate               = useNavigate()
  const { setUser }            = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { dispatch }           = useExpense()
  const [step,  setStep]  = useState('details')
  const [email, setEmail] = useState('')

  const inviteCode = new URLSearchParams(window.location.search).get('code') || ''

  const handleOtpSent = (sentEmail) => {
    setEmail(sentEmail)
    setStep('otp')
  }

  const handleVerified = async (data) => {
    localStorage.setItem('duel-token', data.token)
    setUser(data.user)

    // Hydrate couple right away so ProtectedRoute doesn't bounce to /create
    if (data.user.coupleId) {
      try {
        const { couple } = await couplesApi.getMe()
        dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
        dispatch({ type: 'SET_USER',   payload: { name: data.user.name } })
      } catch { /* CoupleLoader will retry */ }
    }
    navigate('/dashboard')
  }

  const themeBtn = (
    <button
      type="button"
      className={styles.themeBtn}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={20} />
    </button>
  )

  return (
    <PageShell>
      {step === 'details'
        ? <StepDetails onOtpSent={handleOtpSent} themeBtn={themeBtn} inviteCode={inviteCode} />
        : <StepOtp email={email} onVerified={handleVerified} themeBtn={themeBtn} />
      }
    </PageShell>
  )
}

export default RegisterPage
