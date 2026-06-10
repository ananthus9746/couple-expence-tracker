import CategoryBadge from '../CategoryBadge/CategoryBadge'
import Icon from '../Icon/Icon'
import styles from './ExpenseItem.module.css'

const CATEGORY_ICONS = {
  food: 'restaurant',
  transport: 'directions_car',
  shopping: 'shopping_bag',
  bills: 'receipt_long',
  health: 'favorite',
  entertainment: 'movie',
  other: 'category',
}

/**
 * ExpenseItem – single expense row in a list
 *
 * Props:
 *   title    {string}
 *   amount   {number}
 *   category {string}
 *   date     {string}
 *   paidBy   {string}  – name of person who paid
 *   onClick  {function}
 */
const ExpenseItem = ({ title, amount, category = 'other', date, paidBy, onClick, onDelete }) => {
  const iconName = CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.other
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

  return (
    <div className={styles.item} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className={styles.iconBox}>
        <Icon name={iconName} size={20} />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>
          <CategoryBadge category={category} showIcon={false} />
          {paidBy && <span className={styles.by}>· {paidBy}</span>}
        </div>
      </div>
      <div className={styles.right}>
        <span className={[styles.amount, styles.debit].join(' ')}>{formatted}</span>
        {date && <span className={styles.date}>{date}</span>}
      </div>
      {onDelete && (
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onDelete()
          }}
          aria-label={`Delete ${title}`}
        >
          <Icon name="delete" size={18} />
        </button>
      )}
    </div>
  )
}

export default ExpenseItem
