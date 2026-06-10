import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { useTheme } from '../../context/ThemeContext'
import styles from './TopBar.module.css'

/**
 * TopBar – fixed app header, used on all authenticated pages.
 *
 * Props:
 *   title          {string}   – page/app title (default "The Duel")
 *   showAvatars    {boolean}  – partner avatar stack on left (default true)
 *   showBack       {boolean}  – back-arrow before title (default false)
 *   showUserAvatar {boolean}  – current user's avatar on right (default false)
 *   actions        {ReactNode}– extra icon buttons injected into right slot
 *   onNotif        {function} – notification bell click handler
 *   hasNotif       {boolean}  – dot on notification bell
 */
const TopBar = ({
  title = 'The Duel',
  showAvatars = true,
  showBack = false,
  showUserAvatar = false,
  actions,
  onNotif,
  hasNotif = false,
}) => {
  const navigate = useNavigate()
  const { state } = useExpense()
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrollRef.current) {
        scrollRef.current = isScrolled
        setScrolled(isScrolled)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const partnerA = state.couple?.partnerA || 'A'
  const partnerB = state.couple?.partnerB || 'B'
  const coupleName = state.couple?.name
  const userName = state.user?.name || '?'

  const initial = (name) => name.trim()[0]?.toUpperCase() || '?'

  return (
    <header
      className={[styles.header, scrolled ? styles.scrolled : ''].filter(Boolean).join(' ')}
      aria-label="App header"
    >
      {/* ── Left ── */}
      <div className={styles.left}>
        {/* Back arrow */}
        {showBack && (
          <button
            className={styles.iconBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <Icon name="arrow_back" size={22} style={{ color: 'var(--color-primary)' }} />
          </button>
        )}

        {/* Partner avatar stack */}
        {showAvatars && !showBack && (
          <div className={styles.avatarStack} aria-label="Partners">
            {/* B behind */}
            <div className={[styles.avatarRing, styles.partnerB].join(' ')} aria-label={partnerB}>
              <div
                className={styles.avatarInitial}
                style={{ background: 'rgba(215, 242, 255, 0.08)', color: '#2a89dcff' }}
              >
                {initial(partnerB)}
              </div>
            </div>
            {/* A in front */}
            <div className={[styles.avatarRing, styles.partnerA].join(' ')} aria-label={partnerA}>
              <div
                className={styles.avatarInitial}
                style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }}
              >
                {initial(partnerA)}
              </div>
            </div>
          </div>
        )}

        <div className={styles.titleGroup}>
          <h1 className={styles.appTitle}>{title}</h1>
          {coupleName && showAvatars && !showBack && (
            <span className={styles.coupleTag}>{coupleName}</span>
          )}
        </div>
      </div>

      {/* ── Right ── */}
      <div className={styles.actions}>
        {actions}

        {/* Theme toggle */}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={22} />
        </button>

        {/* User avatar (used on back-arrow pages like Add Expense) */}
        {showUserAvatar && (
          <div className={styles.userAvatar} aria-label={userName}>
            <span
              className={styles.userAvatarInitial}
              style={{ background: 'rgba(210,187,255,0.15)', color: 'var(--color-primary)' }}
            >
              {initial(userName)}
            </span>
          </div>
        )}

        {/* Notification bell (default right action) */}
        {!showUserAvatar && !actions && (
          <button
            className={styles.iconBtn}
            onClick={onNotif}
            aria-label="Notifications"
          >
            <Icon name="notifications" size={22} />
            {hasNotif && <span className={styles.notifDot} aria-hidden="true" />}
          </button>
        )}
      </div>
    </header>
  )
}

export default TopBar
