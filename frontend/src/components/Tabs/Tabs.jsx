import styles from './Tabs.module.css'

/**
 * Tabs – segmented control / tab bar
 *
 * Props:
 *   tabs      {Array<{key: string, label: string}>}
 *   active    {string}  – key of active tab
 *   onChange  {function(key: string)}
 *   className {string}
 */
const Tabs = ({ tabs = [], active, onChange, className = '' }) => {
  return (
    <nav
      className={[styles.tabBar, className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label="View tabs"
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          className={[styles.tab, active === key ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange?.(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

export default Tabs
