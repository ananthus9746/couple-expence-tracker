import styles from './ConfirmModal.module.css'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'

/**
 * ConfirmModal – reusable confirmation dialog with dark glassmorphic styling
 *
 * Props:
 *   isOpen      {boolean}
 *   title       {string}
 *   message     {string}
 *   confirmText {string}
 *   cancelText  {string}
 *   onConfirm   {function}
 *   onCancel    {function}
 *   variant     {'danger'|'primary'}
 */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconBox} ${styles[variant]}`}>
            <Icon name={variant === 'danger' ? 'warning' : 'help'} size={24} filled />
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outlined"
            onClick={onCancel}
            className={styles.cancelBtn}
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            className={styles.confirmBtn}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
