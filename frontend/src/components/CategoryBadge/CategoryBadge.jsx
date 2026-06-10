import styles from './CategoryBadge.module.css'
import Icon from '../Icon/Icon'
import { CATEGORY_MAP } from '../../data/categories'

/**
 * CategoryBadge – colored pill showing expense category
 *
 * Props:
 *   category {string} – any key from ALL_CATEGORIES
 *   showIcon {boolean}
 */
const CategoryBadge = ({ category = 'other', showIcon = true }) => {
  const key   = category.toLowerCase()
  const meta  = CATEGORY_MAP[key] || CATEGORY_MAP.other
  const label = meta.label
  const icon  = meta.icon

  const classes = [styles.badge, styles[key] || styles.other].join(' ')

  return (
    <span className={classes}>
      {showIcon && <Icon name={icon} size={12} />}
      {label}
    </span>
  )
}

export default CategoryBadge
