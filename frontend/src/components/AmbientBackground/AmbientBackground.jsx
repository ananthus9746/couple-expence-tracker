import { useEffect, useRef } from 'react'
import styles from './AmbientBackground.module.css'

/**
 * AmbientBackground – fixed decorative background layer
 * Reacts to mouse movement on desktop.
 */
const AmbientBackground = () => {
  const primaryRef = useRef(null)
  const secondaryRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth <= 768) return

    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      if (primaryRef.current) {
        primaryRef.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`
      }
      if (secondaryRef.current) {
        secondaryRef.current.style.transform = `translate(${-x * 30}px, ${-y * 30}px)`
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.gradient} />
      <div className={styles.glowPrimary} ref={primaryRef} />
      <div className={styles.glowSecondary} ref={secondaryRef} />
      <div className={styles.grain} />
    </div>
  )
}

export default AmbientBackground
