import GlassCard from '../GlassCard/GlassCard'
import ProgressBar from '../ProgressBar/ProgressBar'
import styles from './SpendingCard.module.css'

/**
 * SpendingCard – shows a partner's spending summary
 *
 * Props:
 *   name       {string}  – "Partner A" / "Partner B" etc.
 *   amount     {string}  – formatted amount string e.g. "$1,240"
 *   percent    {number}  – 0–100 for progress bar
 *   color      {'primary'|'secondary'|'tertiary'} – accent color
 *   interactive{boolean} – card hover effect
 */
const SpendingCard = ({ name, amount, percent, color = 'primary', interactive = false }) => {
  const labelClass = [styles.label, styles[color]].join(' ')

  return (
    <GlassCard interactive={interactive}>
      <div className={styles.card}>
        <span className={labelClass}>{name}</span>
        <div className={styles.barWrapper}>
          <ProgressBar value={percent} color={color} label={`${name} spending progress`} />
        </div>
        <span className={styles.amount}>{amount}</span>
      </div>
    </GlassCard>
  )
}

export default SpendingCard
