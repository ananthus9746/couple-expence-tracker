import styles from './DuelBar.module.css'

/**
 * DuelBar – two-color combined spending bar showing both partners' share.
 *
 * Props:
 *   partnerA     {string}  – name
 *   partnerB     {string}  – name
 *   amountA      {string}  – formatted amount string
 *   amountB      {string}  – formatted amount string
 *   percentA     {number}  – 0–100 (B fills remainder)
 *   showLabels   {boolean} – show name + amount rows below bar
 */
const DuelBar = ({
  partnerA = 'Partner A',
  partnerB = 'Partner B',
  amountA = '$0',
  amountB = '$0',
  percentA = 50,
  showLabels = true,
}) => {
  const clampedA = Math.min(100, Math.max(0, percentA))
  const clampedB = 100 - clampedA

  return (
    <div>
      <div
        className={styles.track}
        role="img"
        aria-label={`${partnerA} ${clampedA}% vs ${partnerB} ${clampedB}%`}
      >
        <div className={styles.segmentA} style={{ width: `${clampedA}%` }} />
        <div className={styles.segmentB} style={{ width: `${clampedB}%` }} />
      </div>

      {showLabels && (
        <div className={styles.labels}>
          <div className={styles.labelA}>
            <span className={styles.partnerName}>{partnerA}</span>
            <span className={[styles.amount, styles.amountA].join(' ')}>{amountA}</span>
          </div>
          <div className={styles.labelB}>
            <span className={styles.partnerName}>{partnerB}</span>
            <span className={[styles.amount, styles.amountB].join(' ')}>{amountB}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DuelBar
