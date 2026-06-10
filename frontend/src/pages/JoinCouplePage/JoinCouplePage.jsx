import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import GlassCard from '../../components/GlassCard/GlassCard'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { useAuth } from '../../context/AuthContext'
import { auth as authApi, couples as couplesApi, setToken } from '../../services/api'
import { couplePayload } from '../../utils/couplePayload'
import styles from './JoinCouplePage.module.css'

const JoinCouplePage = () => {
  const navigate  = useNavigate()
  const { dispatch } = useExpense()
  const { user, setUser, refreshUser } = useAuth()

  const [yourName, setYourName] = useState(user?.name || '')
  const [code,     setCode]     = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!yourName.trim())       e.yourName = 'Your name is required'
    if (code.trim().length < 4) e.code     = 'Please enter a valid invite code'
    return e
  }

  const validateCodeOnly = () => {
    const e = {}
    if (code.trim().length < 4) e.code = 'Please enter a valid invite code'
    return e
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleJoin(e)
  }

  const handleJoin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    const errs = validateCodeOnly()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      if (!user) {
        // Passwordless login & join for guest
        const data = await authApi.joinWithCode(code.trim().toUpperCase())
        setToken(data.token)
        setUser(data.user)

        const { couple } = await couplesApi.getMe()
        dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
        dispatch({ type: 'SET_USER',   payload: { name: data.user.name } })

        navigate('/dashboard')
        return
      }

      // Logged-in user flow
      const fullErrs = validate()
      if (Object.keys(fullErrs).length) { setErrors(fullErrs); return }

      const { couple } = await couplesApi.join({
        inviteCode:   code.trim().toUpperCase(),
        partnerBName: yourName.trim(),
      })

      dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
      dispatch({ type: 'SET_USER',   payload: { name: yourName.trim() } })

      await refreshUser()
      navigate('/dashboard')
    } catch (err) {
      // Already belongs to this couple — just go to dashboard
      if (err.message?.toLowerCase().includes('already belong')) {
        try {
          const { couple } = await couplesApi.getMe()
          dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
          dispatch({ type: 'SET_USER',   payload: { name: user?.name || yourName.trim() } })
          navigate('/dashboard')
          return
        } catch { /* fall through */ }
      }
      setApiError(err.message || 'Failed to join couple')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="Go back">
          <Icon name="arrow_back" size={20} />
          Back
        </button>
        <h1 className={styles.title}>Join your partner</h1>
        <p className={styles.subtitle}>
          Enter the invite code your partner shared
        </p>
      </div>

      <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
        <fieldset className={styles.fieldset}>
          <legend style={{ display: 'none' }}>Join couple form</legend>

          {/* Only ask for name if already logged in */}
          {user && (
            <InputField
              label="Your name"
              placeholder="e.g. Jordan"
              value={yourName}
              onChange={(e) => { setYourName(e.target.value); setErrors((p) => ({ ...p, yourName: '' })) }}
              error={errors.yourName}
              leadingIcon="person"
              autoFocus
            />
          )}

          <InputField
            label="Invite code"
            placeholder="e.g. A3F9B2"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 8)); setErrors((p) => ({ ...p, code: '' })) }}
            error={errors.code}
            leadingIcon="key"
            maxLength={8}
            autoFocus={!user}
            style={{ letterSpacing: '0.15em', fontWeight: 700 }}
          />
        </fieldset>

        <GlassCard>
          <div className={styles.infoCard}>
            <Icon name="info" size={20} className={styles.infoIcon} />
            <p className={styles.infoText}>
              {user
                ? 'Your partner shared this code with you. Enter it to link your accounts.'
                : 'Enter the invite code shared by your partner to start tracking together instantly.'}
            </p>
          </div>
        </GlassCard>

        {apiError && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-body-sm-size)', textAlign: 'center' }}>
            {apiError}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Joining…' : 'Join & Start Tracking'}
          </Button>
        </div>
      </form>
    </PageShell>
  )
}

export default JoinCouplePage
