import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import GlassCard from '../../components/GlassCard/GlassCard'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { useAuth } from '../../context/AuthContext'
import { couples as couplesApi } from '../../services/api'
import { couplePayload } from '../../utils/couplePayload'
import styles from './CreateCouplePage.module.css'

const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()

const CreateCouplePage = () => {
  const navigate  = useNavigate()
  const { state, dispatch } = useExpense()
  const { user, refreshUser } = useAuth()

  // If user already has a couple — redirect immediately
  useEffect(() => {
    if (state.couple || user?.coupleId) {
      navigate('/dashboard', { replace: true })
    }
  }, [state.couple, user?.coupleId, navigate])

  const [yourName,    setYourName]    = useState(user?.name || '')
  const [partnerName, setPartnerName] = useState('')
  const [coupleName,  setCoupleName]  = useState('')
  const [inviteCode]  = useState(() => generateCode())
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [apiError,    setApiError]    = useState('')
  const [realCode,    setRealCode]    = useState(null) // code returned by backend

  const validate = () => {
    const e = {}
    if (!yourName.trim())    e.yourName    = 'Your name is required'
    if (!partnerName.trim()) e.partnerName = "Partner's name is required"
    return e
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      const { couple } = await couplesApi.create({
        partnerAName: yourName.trim(),
        partnerBName: partnerName.trim(),
        name: coupleName.trim() || `${yourName.trim()} & ${partnerName.trim()}`,
      })

      setRealCode(couple.inviteCode)

      dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
      dispatch({ type: 'SET_USER',   payload: { name: yourName.trim() } })

      await refreshUser()
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.message || 'Failed to create couple')
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
        <h1 className={styles.title}>Create your couple</h1>
        <p className={styles.subtitle}>Set up your shared expense tracker</p>
      </div>

      <form className={styles.form} onSubmit={handleCreate} noValidate>
        <fieldset className={styles.fieldset}>
          <legend className={styles.fieldsetLegend}>Your details</legend>
          <InputField
            label="Your name"
            placeholder="e.g. Alex"
            value={yourName}
            onChange={(e) => {
              setYourName(e.target.value)
              setErrors((prev) => ({ ...prev, yourName: '' }))
            }}
            error={errors.yourName}
            leadingIcon="person"
            autoFocus
          />
          <InputField
            label="Partner's name"
            placeholder="e.g. Jordan"
            value={partnerName}
            onChange={(e) => {
              setPartnerName(e.target.value)
              setErrors((prev) => ({ ...prev, partnerName: '' }))
            }}
            error={errors.partnerName}
            leadingIcon="favorite"
          />
          <InputField
            label="Couple name (optional)"
            placeholder="e.g. The Dream Team"
            value={coupleName}
            onChange={(e) => setCoupleName(e.target.value)}
            leadingIcon="stars"
          />
        </fieldset>

        {/* Invite code display */}
        <GlassCard elevated>
          <div className={styles.codeCard}>
            <span className={styles.codeLabel}>Your invite code</span>
            <span className={styles.code}>{realCode || inviteCode}</span>
            <p className={styles.codeHint}>
              Share this code with your partner so they can join
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
            {loading ? 'Creating…' : 'Create & Start Tracking'}
          </Button>
        </div>
      </form>
    </PageShell>
  )
}

export default CreateCouplePage
