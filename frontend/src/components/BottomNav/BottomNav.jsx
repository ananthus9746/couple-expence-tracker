import { NavLink } from 'react-router-dom'
import Icon from '../Icon/Icon'
import styles from './BottomNav.module.css'

/**
 * BottomNav – 5-tab fixed bottom navigation.
 *
 * Layout:  Home  |  History  |  [+FAB]  |  Insights  |  Profile
 *
 * The center Add button is a floating pill (always lifted).
 * The other 4 tabs use a spring-lift pill on active.
 */
const BottomNav = () => {
  return (
    <nav className={styles.nav} aria-label="Main navigation">

      {/* Home */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
        }
        aria-label="Home"
      >
        {({ isActive }) => (
          <span className={styles.pill}>
            <span className={styles.iconWrap}>
              <Icon name="home" size={22} filled={isActive} />
            </span>
            <span className={styles.label}>Home</span>
          </span>
        )}
      </NavLink>

      {/* History */}
      <NavLink
        to="/history"
        className={({ isActive }) =>
          [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
        }
        aria-label="History"
      >
        {({ isActive }) => (
          <span className={styles.pill}>
            <span className={styles.iconWrap}>
              <Icon name="history" size={22} filled={isActive} />
            </span>
            <span className={styles.label}>History</span>
          </span>
        )}
      </NavLink>

      {/* Center FAB — Add */}
      <NavLink
        to="/add"
        className={({ isActive }) =>
          [styles.fabItem, isActive ? styles.active : ''].filter(Boolean).join(' ')
        }
        aria-label="Add expense"
      >
        {({ isActive }) => (
          <span className={styles.fabPill}>
            <Icon name="add" size={28} />
          </span>
        )}
      </NavLink>

      {/* Insights */}
      <NavLink
        to="/insights"
        className={({ isActive }) =>
          [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
        }
        aria-label="Insights"
      >
        {({ isActive }) => (
          <span className={styles.pill}>
            <span className={styles.iconWrap}>
              <Icon name="insights" size={22} filled={isActive} />
            </span>
            <span className={styles.label}>Insights</span>
          </span>
        )}
      </NavLink>

      {/* Profile */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
        }
        aria-label="Profile"
      >
        {({ isActive }) => (
          <span className={styles.pill}>
            <span className={styles.iconWrap}>
              <Icon name="person" size={22} filled={isActive} />
            </span>
            <span className={styles.label}>Profile</span>
          </span>
        )}
      </NavLink>

    </nav>
  )
}

export default BottomNav
