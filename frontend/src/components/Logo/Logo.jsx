import styles from './Logo.module.css'
import Icon from '../Icon/Icon'

/**
 * Logo – app identity mark
 *
 * Props:
 *   showWordmark {boolean} – show "The Duel" text below icon
 *   size         {'sm'|'md'|'lg'} – icon box size
 */
const Logo = ({ showWordmark = false }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBox}>
        <Icon name="swords" size={32} filled className={styles.icon} />
      </div>
      {showWordmark && <span className={styles.wordmark}>The Duel</span>}
    </div>
  )
}

export default Logo
