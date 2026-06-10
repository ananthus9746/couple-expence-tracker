import { useEffect, useState } from 'react'
import styles from './InstallPWA.module.css'
import Icon from '../Icon/Icon'
import Button from '../Button/Button'

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)

  // Helper: check if running standalone (already installed)
  const isStandalone = () => {
    return (
      window.navigator.standalone || 
      window.matchMedia('(display-mode: standalone)').matches
    )
  }

  // Helper: check if device is iOS
  const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  }

  useEffect(() => {
    // 1. Listen for browser native install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)

      const dontShowAgain = localStorage.getItem('pwa-dont-show-again')
      if (dontShowAgain !== 'true' && !isStandalone()) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 2. Check for iOS device and handle manual prompt if not standalone
    const dontShowAgain = localStorage.getItem('pwa-dont-show-again')
    if (isIOSDevice() && !isStandalone() && dontShowAgain !== 'true') {
      // Show iOS helper banner after 3 seconds
      const timer = setTimeout(() => {
        setShowIOSPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the browser install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA install prompt outcome: ${outcome}`)

    // We've used the prompt, we can't use it again
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleLaterClick = () => {
    setShowPrompt(false)
    setShowIOSPrompt(false)
  }

  const handleDontShowAgainClick = () => {
    localStorage.setItem('pwa-dont-show-again', 'true')
    setShowPrompt(false)
    setShowIOSPrompt(false)
  }

  // If neither prompt is active, render nothing
  if (!showPrompt && !showIOSPrompt) return null

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button 
          className={styles.closeBtn} 
          onClick={handleLaterClick}
          aria-label="Close installation prompt"
        >
          <Icon name="close" size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <img 
              src="/web-app-manifest-192x192.png" 
              alt="The Duel Logo" 
              className={styles.logo}
              onError={(e) => {
                // Fallback to swords icon if image fails to load
                e.target.style.display = 'none'
              }}
            />
            <div className={styles.fallbackIcon}>
              <Icon name="swords" size={24} filled />
            </div>
          </div>
          <div className={styles.textContainer}>
            <h3 className={styles.title}>Install The Duel</h3>
            <p className={styles.subtitle}>Couple Expense Tracker</p>
          </div>
        </div>

        <div className={styles.body}>
          {showIOSPrompt ? (
            <p className={styles.description}>
              Tap the Share button{' '}
              <span className={styles.inlineIcon}>
                <Icon name="ios_share" size={18} />
              </span>{' '}
              in Safari, then select{' '}
              <strong>Add to Home Screen</strong>{' '}
              <span className={styles.inlineIcon}>
                <Icon name="add_to_home_screen" size={18} />
              </span>{' '}
              to install the app.
            </p>
          ) : (
            <p className={styles.description}>
              Install our app on your device for fast access, offline tracking, and a premium full-screen experience.
            </p>
          )}
        </div>

        <div className={styles.actions}>
          {!showIOSPrompt ? (
            <Button 
              variant="primary" 
              size="md" 
              onClick={handleInstallClick}
              className={styles.installBtn}
              fullWidth
            >
              Install
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="md" 
              onClick={handleLaterClick}
              className={styles.installBtn}
              fullWidth
            >
              Got It
            </Button>
          )}

          <div className={styles.secondaryActions}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLaterClick}
              className={styles.laterBtn}
              fullWidth={false}
            >
              Later
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDontShowAgainClick}
              className={styles.dontShowBtn}
              fullWidth={false}
            >
              Don't show again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallPWA
