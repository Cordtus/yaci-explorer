import { Activity, BarChart3, Blocks, FileCode2, Home, Moon, Sun, Monitor } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ResetNotice } from '@/components/common/reset-notice'
import { SearchBar } from '@/components/common/search-bar'
import { getBrandingConfig } from '@/config/branding'
import { useTheme } from '@/contexts/ThemeContext'
import { css, cx } from '@/styled-system/css'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/tx', icon: Activity },
  { name: 'EVM', href: '/evm/contracts', icon: FileCode2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={css({ h: '9', w: '9' })}
      title={`Theme: ${theme} (${resolvedTheme})`}
    >
      {theme === 'system' ? (
        <Monitor className={css({ h: '4', w: '4' })} />
      ) : resolvedTheme === 'dark' ? (
        <Moon className={css({ h: '4', w: '4' })} />
      ) : (
        <Sun className={css({ h: '4', w: '4' })} />
      )}
    </Button>
  )
}

export function Header() {
  const location = useLocation()
  const pathname = location.pathname
  const branding = getBrandingConfig()

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <Link to="/" className={styles.brand}>
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.appName} className={styles.logo} />
              ) : (
                <div className={styles.logoPlaceholder} />
              )}
              <span className={styles.brandNameFull}>{branding.appName}</span>
              <span className={styles.brandNameShort}>{branding.appNameShort}</span>
            </Link>

            <nav className={styles.nav}>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href.startsWith('/evm') && pathname.startsWith('/evm'))
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cx(styles.navLink, isActive ? styles.navLinkActive : styles.navLinkInactive)}
                  >
                    <Icon className={styles.navIcon} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className={styles.right}>
            <SearchBar />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <ResetNotice />
    </header>
  )
}

const styles = {
  header: css({
    position: 'sticky',
    top: '0',
    zIndex: '50',
    w: 'full',
    borderBottomWidth: '1px',
    bg: 'bg.default/95',
    backdropFilter: 'blur(8px)',
  }),
  container: css({
    maxW: '7xl',
    mx: 'auto',
    px: '4',
  }),
  inner: css({
    display: 'flex',
    h: '16',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  left: css({
    display: 'flex',
    alignItems: 'center',
    gap: '6',
  }),
  right: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4',
  }),
  brand: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  }),
  logo: css({
    h: '8',
    w: '8',
  }),
  logoPlaceholder: css({
    h: '8',
    w: '8',
    rounded: 'full',
    bg: 'accent.default',
  }),
  brandNameFull: css({
    fontSize: 'xl',
    fontWeight: 'bold',
    display: { base: 'none', sm: 'inline' },
  }),
  brandNameShort: css({
    fontSize: 'xl',
    fontWeight: 'bold',
    display: { base: 'inline', sm: 'none' },
  }),
  nav: css({
    display: { base: 'none', md: 'flex' },
    alignItems: 'center',
    gap: '6',
    fontSize: 'sm',
    fontWeight: 'medium',
  }),
  navLink: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    transition: 'colors',
  }),
  navLinkActive: css({
    color: 'fg.default',
  }),
  navLinkInactive: css({
    color: 'fg.muted',
    _hover: { color: 'fg.default' },
  }),
  navIcon: css({
    h: '4',
    w: '4',
  }),
}
