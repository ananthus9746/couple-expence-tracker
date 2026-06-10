import styles from './Avatar.module.css'

/**
 * Avatar – user profile picture or initials fallback
 *
 * Props:
 *   src     {string} – image URL
 *   name    {string} – used for initials fallback & alt text
 *   size    {'sm'|'md'|'lg'|'xl'}
 *   color   {'primary'|'secondary'|'tertiary'|'surface'} – background when no image
 */
const Avatar = ({ src, name = '?', size = 'md', color = 'primary' }) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const classes = [styles.avatar, styles[size], !src ? styles[color] : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} aria-label={name} role="img">
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  )
}

export default Avatar
