import styles from './AppLoader.module.css'

/**
 * Full-screen centered spinner shown while auth/couple state is hydrating.
 */
const AppLoader = () => (
  <div className={styles.root} aria-label="Loading" role="status">
    <div className={styles.logo}>
      <span className={styles.emoji}>💸</span>
    </div>
    <div className={styles.spinner}>
      <div className={styles.ring} />
    </div>
  </div>
)

export default AppLoader
