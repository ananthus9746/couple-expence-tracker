import styles from './PageShell.module.css'
import AmbientBackground from '../AmbientBackground/AmbientBackground'
import BottomNav from '../BottomNav/BottomNav'
import TopBar from '../TopBar/TopBar'

/**
 * PageShell – layout wrapper for every page.
 *
 * Props:
 *   centered     {boolean}  – vertically center content (landing-style pages)
 *   showNav      {boolean}  – render BottomNav
 *   showHeader   {boolean}  – render fixed TopBar
 *   topBarProps  {object}   – props forwarded to <TopBar> (title, actions, onNotif, hasNotif, showAvatars)
 *   children     {ReactNode}
 */
const PageShell = ({
  centered = false,
  showNav = false,
  showHeader = false,
  topBarProps = {},
  children,
}) => {
  const shellClasses = [
    styles.shell,
    showNav ? styles.withNav : '',
    showHeader ? styles.withHeader : '',
  ]
    .filter(Boolean)
    .join(' ')

  const contentClasses = [
    styles.content,
    centered ? styles.centered : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <AmbientBackground />

      {showHeader && <TopBar {...topBarProps} />}

      <div className={shellClasses}>
        <main className={contentClasses}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </>
  )
}

export default PageShell
