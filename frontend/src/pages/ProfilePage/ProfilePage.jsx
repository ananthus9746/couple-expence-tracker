import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import GlassCard from '../../components/GlassCard/GlassCard'
import Avatar from '../../components/Avatar/Avatar'
import Icon from '../../components/Icon/Icon'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import { useExpense } from '../../context/ExpenseContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { couples as couplesApi } from '../../services/api'
import { couplePayload } from '../../utils/couplePayload'
import styles from './ProfilePage.module.css'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { state, stats, dispatch } = useExpense()
  const { logout, refreshUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const name       = state.user?.name   || 'You'
  const coupleName = state.couple?.name || ''
  const isDark     = theme === 'dark'

  // Couple creation/joining state
  const [mode, setMode] = useState('create') // 'create' or 'join'
  const [partnerName, setPartnerName] = useState('')
  const [coupleNameInput, setCoupleNameInput] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [errors, setErrors] = useState({})

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  const myTotal = state.expenses
    .filter((e) => e.paidBy === (state.user?.name || stats.partnerA))
    .reduce((s, e) => s + e.amount, 0)

  const handleLogout = () => {
    if (!window.confirm('Log out? You can always sign back in.')) return
    dispatch({ type: 'RESET' })
    logout()
    navigate('/login')
  }

  const handleCreateCouple = async (e) => {
    e.preventDefault()
    if (!partnerName.trim()) {
      setErrors({ partnerName: "Partner's name is required" })
      return
    }
    setLoading(true)
    setApiError('')
    setErrors({})
    try {
      const { couple } = await couplesApi.create({
        partnerAName: name,
        partnerBName: partnerName.trim(),
        name: coupleNameInput.trim() || `${name} & ${partnerName.trim()}`,
      })
      dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
      dispatch({ type: 'SET_USER',   payload: { name } })
      await refreshUser()
    } catch (err) {
      setApiError(err.message || 'Failed to create couple')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCouple = async (e) => {
    e.preventDefault()
    if (inviteCode.trim().length < 4) {
      setErrors({ inviteCode: 'Please enter a valid invite code' })
      return
    }
    setLoading(true)
    setApiError('')
    setErrors({})
    try {
      const { couple } = await couplesApi.join({
        inviteCode: inviteCode.trim().toUpperCase(),
        partnerBName: name,
      })
      dispatch({ type: 'SET_COUPLE', payload: couplePayload(couple) })
      dispatch({ type: 'SET_USER',   payload: { name } })
      await refreshUser()
    } catch (err) {
      setApiError(err.message || 'Failed to join couple')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell showNav showHeader topBarProps={{ title: 'Profile', showAvatars: false }}>

      {/* ── Hero ── */}
      <GlassCard elevated>
        <div className={styles.heroCard}>
          <Avatar name={name} size="xl" color="primary" />
          <div className={styles.heroInfo}>
            <div className={styles.name}>{name}</div>
            {coupleName && <div className={styles.coupleName}>{coupleName}</div>}
          </div>
        </div>
      </GlassCard>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <GlassCard>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{state.expenses.length}</span>
            <span className={styles.statLabel}>Expenses</span>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{fmt(myTotal)}</span>
            <span className={styles.statLabel}>My Total</span>
          </div>
        </GlassCard>
        <GlassCard>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{fmt(stats.total)}</span>
            <span className={styles.statLabel}>Together</span>
          </div>
        </GlassCard>
      </div>

      {/* ── Couple ── */}
      {state.couple ? (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Couple</p>
          <div className={styles.menuList}>

            {/* Couple info */}
            <div className={styles.menuItem} style={{ cursor: 'default' }}>
              <span className={styles.menuIcon} style={{ background: 'rgba(6,193,103,0.12)' }}>
                <Icon name="favorite" size={20} style={{ color: 'var(--color-partner-a)' }} />
              </span>
              <div className={styles.menuLabelGroup}>
                <span className={styles.menuLabel}>{state.couple.name}</span>
                <span className={styles.menuSub}>
                  {state.couple.partnerA} &amp; {state.couple.partnerB || 'Waiting for partner…'}
                </span>
              </div>
            </div>

            {/* Invite code */}
            <div className={styles.menuItem} style={{ cursor: 'default' }}>
              <span className={styles.menuIcon} style={{ background: 'rgba(96,165,250,0.12)' }}>
                <Icon name="key" size={20} style={{ color: '#60a5fa' }} />
              </span>
              <div className={styles.menuLabelGroup}>
                <span className={styles.menuLabel}>Invite Code</span>
                <span className={styles.menuSub} style={{ letterSpacing: '0.12em', fontWeight: 700, color: 'var(--color-on-surface)', fontSize: 'var(--text-body-md-size)' }}>
                  {state.couple.inviteCode || '—'}
                </span>
              </div>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard?.writeText(state.couple.inviteCode || '')
                    .then(() => alert('Invite code copied!'))
                    .catch(() => {})
                }}
                aria-label="Copy invite code"
              >
                <Icon name="content_copy" size={18} />
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Link with your partner</p>
          <GlassCard elevated>
            <div className={styles.setupCard}>
              <div className={styles.tabRow}>
                <button
                  type="button"
                  className={[styles.tabBtn, mode === 'create' ? styles.tabBtnActive : ''].join(' ')}
                  onClick={() => { setMode('create'); setApiError(''); setErrors({}); }}
                >
                  Create Couple
                </button>
                <button
                  type="button"
                  className={[styles.tabBtn, mode === 'join' ? styles.tabBtnActive : ''].join(' ')}
                  onClick={() => { setMode('join'); setApiError(''); setErrors({}); }}
                >
                  Join Couple
                </button>
              </div>

              {mode === 'create' ? (
                <form onSubmit={handleCreateCouple} className={styles.setupForm} noValidate>
                  <InputField
                    label="Partner's name"
                    placeholder="e.g. Jordan"
                    value={partnerName}
                    onChange={(e) => { setPartnerName(e.target.value); setErrors({}); }}
                    error={errors.partnerName}
                    leadingIcon="favorite"
                  />
                  <InputField
                    label="Couple name (optional)"
                    placeholder="e.g. The Dream Team"
                    value={coupleNameInput}
                    onChange={(e) => setCoupleNameInput(e.target.value)}
                    leadingIcon="stars"
                  />
                  {apiError && <p className={styles.formError}>{apiError}</p>}
                  <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Creating…' : 'Create & Start Tracking'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleJoinCouple} className={styles.setupForm} noValidate>
                  <InputField
                    label="Invite code"
                    placeholder="e.g. A3F9B2"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase().slice(0, 8)); setErrors({}); }}
                    error={errors.inviteCode}
                    leadingIcon="key"
                    maxLength={8}
                    style={{ letterSpacing: '0.15em', fontWeight: 700 }}
                  />
                  {apiError && <p className={styles.formError}>{apiError}</p>}
                  <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Joining…' : 'Join & Start Tracking'}
                  </Button>
                </form>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Preferences ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Preferences</p>
        <div className={styles.menuList}>
          <div className={styles.menuItem}>
            <span
              className={styles.menuIcon}
              style={{ background: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.12)' }}
            >
              <Icon
                name={isDark ? 'light_mode' : 'dark_mode'}
                size={20}
                style={{ color: isDark ? '#fbbf24' : '#818cf8' }}
              />
            </span>
            <div className={styles.menuLabelGroup}>
              <span className={styles.menuLabel}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              <span className={styles.menuSub}>Currently {isDark ? 'dark' : 'light'} theme</span>
            </div>
            <button
              type="button"
              className={[styles.toggleSwitch, isDark ? styles.toggleOn : ''].filter(Boolean).join(' ')}
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label="Toggle theme"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Account ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Account</p>
        <div className={styles.menuList}>
          <button
            className={[styles.menuItem, styles.dangerItem].join(' ')}
            onClick={handleLogout}
          >
            <span className={styles.menuIcon}>
              <Icon name="logout" size={20} />
            </span>
            <div className={styles.menuLabelGroup}>
              <span className={styles.menuLabel}>Log Out</span>
              <span className={styles.menuSub}>Sign out of your account</span>
            </div>
            <Icon name="chevron_right" size={20} className={styles.menuArrow} />
          </button>
        </div>
      </div>

    </PageShell>
  )
}

export default ProfilePage
