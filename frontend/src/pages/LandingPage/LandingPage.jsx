import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import Logo from '../../components/Logo/Logo'
import Button from '../../components/Button/Button'
import GlassCard from '../../components/GlassCard/GlassCard'
import Icon from '../../components/Icon/Icon'
import { useAuth } from '../../context/AuthContext'
import styles from './LandingPage.module.css'

const LandingPage = () => {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  return (
    <PageShell centered>

      {/* Hero */}
      <section className={styles.hero} aria-label="App introduction">
        <div className={styles.heroLogo}>
          <Logo />
        </div>
        <h1 className={styles.headline}>Money fights end here.</h1>
        <p className={styles.subheadline}>
          Track expenses together. See who&apos;s overspending 😉
        </p>
      </section>

      {/* Feature highlights */}
      <section className={styles.features} aria-label="Features">
        {[
          { icon: 'receipt_long',   text: 'Log expenses in seconds'        },
          { icon: 'insights',       text: 'See daily & monthly breakdowns' },
          { icon: 'mail',           text: 'Invite your partner via email'  },
        ].map(({ icon, text }) => (
          <div key={icon} className={styles.featureItem}>
            <Icon name={icon} size={20} style={{ color: 'var(--color-partner-a)', flexShrink: 0 }} />
            <span>{text}</span>
          </div>
        ))}
      </section>

      {/* CTA — different for guests vs logged-in-no-couple */}
      <section className={styles.actions} aria-label="Get started">
        {user ? (
          /* Logged in but no couple yet */
          <>
            <p className={styles.welcomeBack}>
              Welcome back, <strong>{user.name}</strong> 👋
            </p>
            <Button variant="primary" onClick={() => navigate('/create')}>
              Create a Couple
            </Button>
            <Button variant="outlined" onClick={() => navigate('/join')}>
              Join with Invite Code
            </Button>
          </>
        ) : (
          /* Not logged in */
          <>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Create Account
            </Button>
            <Button variant="outlined" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </>
        )}
      </section>

      {/* Invite code shortcut — always visible */}
      <GlassCard>
        <button
          className={styles.joinCodeBtn}
          onClick={() => navigate('/join')}
          aria-label="Join with an invite code"
        >
          <Icon name="key" size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span className={styles.joinCodeText}>
            Have an invite code? <strong>Join here</strong>
          </span>
          <Icon name="chevron_right" size={18} style={{ color: 'var(--color-on-surface-variant)', opacity: 0.5, flexShrink: 0 }} />
        </button>
      </GlassCard>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          By continuing, you agree to our{' '}
          <a href="#" className={styles.footerLink}>Terms of Duel</a>
        </p>
      </footer>
    </PageShell>
  )
}

export default LandingPage
