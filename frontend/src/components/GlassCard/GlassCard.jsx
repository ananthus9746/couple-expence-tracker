import styles from './GlassCard.module.css'

/**
 * GlassCard – frosted-glass surface container
 *
 * Props:
 *   interactive {boolean} – adds hover/active transitions
 *   elevated    {boolean} – adds drop shadow
 *   className   {string}
 *   children    {ReactNode}
 *   ...rest     – forwarded to the div (onClick, etc.)
 */
const GlassCard = ({ interactive = false, elevated = false, className = '', children, ...rest }) => {
  const classes = [
    styles.card,
    interactive ? styles.interactive : '',
    elevated ? styles.elevated : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

export default GlassCard
