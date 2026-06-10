/**
 * Icon – thin wrapper around Material Symbols Outlined
 * Props:
 *   name      {string}  – Material Symbol name (e.g. "swords")
 *   size      {number}  – font-size in px (default 24)
 *   filled    {boolean} – use filled variant (default false)
 *   className {string}  – extra class names
 *   style     {object}  – inline styles
 */
const Icon = ({ name, size = 24, filled = false, className = '', style = {}, ...rest }) => {
  const classes = ['material-symbols-outlined', filled ? 'filled' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      style={{ fontSize: size, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {name}
    </span>
  )
}

export default Icon
