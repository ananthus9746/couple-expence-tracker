import styles from './ProgressBar.module.css'

/**
 * ProgressBar
 *
 * Props:
 *   value   {number}  – 0–100 percentage
 *   color   {'primary'|'secondary'|'tertiary'|'error'} – fill color
 *   size    {'thin'|'md'|'thick'} – track height
 *   label   {string}  – accessible label
 */
const ProgressBar = ({ value = 0, color = 'primary', size = 'md', label = 'Progress' }) => {
  const clamped = Math.min(100, Math.max(0, value))

  const trackClasses = [styles.track, size !== 'md' ? styles[size] : '']
    .filter(Boolean)
    .join(' ')

  const fillClasses = [styles.fill, color !== 'primary' ? styles[color] : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={trackClasses}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={fillClasses} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export default ProgressBar
