import styles from './Divider.module.css'

/**
 * Divider – horizontal rule with optional center label
 *
 * Props:
 *   label {string} – text shown in the middle
 */
const Divider = ({ label = 'OR' }) => (
  <div className={styles.divider} role="separator">
    <div className={styles.line} />
    {label && <span className={styles.label}>{label}</span>}
    <div className={styles.line} />
  </div>
)

export default Divider
