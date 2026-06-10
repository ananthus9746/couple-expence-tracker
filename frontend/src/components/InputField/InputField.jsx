import { forwardRef, useState } from 'react'
import Icon from '../Icon/Icon'
import styles from './InputField.module.css'

/**
 * InputField – labeled text input with optional icons
 *
 * Props:
 *   label              {string}
 *   helper             {string}   – hint text below input
 *   error              {string}   – error message
 *   leadingIcon        {string}   – Material Symbol name
 *   trailingIcon       {string}   – Material Symbol name (static)
 *   onTrailingIconClick{function} – makes trailing icon a button
 *   type               {string}   – if 'password', eye toggle is auto-added
 *   id                 {string}
 *   ...rest            – forwarded to <input>
 */
const InputField = forwardRef(
  (
    {
      label,
      helper,
      error,
      leadingIcon,
      trailingIcon,
      onTrailingIconClick,
      id,
      type = 'text',
      className = '',
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    const inputId   = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`
    const hasError  = Boolean(error)
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    // Trailing icon: eye for password, or custom
    const trailingName   = isPassword
      ? (showPassword ? 'visibility_off' : 'visibility')
      : trailingIcon
    const hasTrailing    = isPassword || Boolean(trailingIcon)
    const trailingAction = isPassword
      ? () => setShowPassword((v) => !v)
      : onTrailingIconClick

    const groupClasses = [styles.group, hasError ? styles.error : '', className]
      .filter(Boolean).join(' ')

    const inputClasses = [
      styles.input,
      leadingIcon ? styles.hasLeadingIcon  : '',
      hasTrailing ? styles.hasTrailingIcon : '',
    ].filter(Boolean).join(' ')

    return (
      <div className={groupClasses}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className={styles.inputWrap}>
          {leadingIcon && (
            <span className={styles.leadingIcon} aria-hidden="true">
              <Icon name={leadingIcon} size={20} />
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={helper || error ? `${inputId}-helper` : undefined}
            {...rest}
          />

          {hasTrailing && (
            trailingAction ? (
              <button
                type="button"
                className={styles.trailingBtn}
                onClick={trailingAction}
                aria-label={
                  isPassword
                    ? showPassword ? 'Hide password' : 'Show password'
                    : undefined
                }
                tabIndex={-1}
              >
                <Icon name={trailingName} size={20} />
              </button>
            ) : (
              <span className={styles.trailingIcon} aria-hidden="true">
                <Icon name={trailingName} size={20} />
              </span>
            )
          )}
        </div>

        {(error || helper) && (
          <span
            className={styles.helper}
            id={`${inputId}-helper`}
            role={error ? 'alert' : undefined}
          >
            {error || helper}
          </span>
        )}
      </div>
    )
  }
)

InputField.displayName = 'InputField'
export default InputField
