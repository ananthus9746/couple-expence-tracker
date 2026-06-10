import styles from './Button.module.css'

/**
 * Button – fully reusable button component
 *
 * Props:
 *   variant   {'primary'|'outlined'|'surface'|'secondary'|'danger'|'ghost'}
 *   size      {'sm'|'md'|'lg'}
 *   icon      {ReactNode}  – left icon slot
 *   fullWidth {boolean}    – default true
 *   as        {string}     – render as different element (e.g. 'a')
 *   children  {ReactNode}
 *   className {string}
 *   ...rest   – forwarded to the element (onClick, href, disabled, etc.)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = true,
  as: Tag = 'button',
  children,
  className = '',
  ...rest
}) => {
  const classes = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    !fullWidth ? styles.auto : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag className={classes} {...rest}>
      {icon && <span className={styles.iconSlot}>{icon}</span>}
      {children}
    </Tag>
  )
}

export default Button
