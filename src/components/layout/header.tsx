import { Activity, BarChart3, Blocks, Home, Moon, Sun, Monitor } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ResetNotice } from '@/components/common/reset-notice'
import { SearchBar } from '@/components/common/search-bar'
import { getBrandingConfig } from '@/config/branding'
import { useTheme } from '@/contexts/ThemeContext'
import { css, cx } from '@/styled-system/css'
import { Button } from '@/components/ui/button'

const EthereumIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 256 417"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M127.961 0L125.343 9.066v283.296l2.618 2.617 127.962-75.638L127.961 0z" fill="currentColor"/>
    <path d="M127.961 0L0 219.341l127.961 75.638V157.724L127.961 0z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M127.961 312.187L126.386 314.154v98.29l1.575 4.6L256 236.587l-128.039 75.6z" fill="currentColor"/>
    <path d="M127.961 417.044v-104.857L0 236.587l127.961 180.457z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M127.961 295.979l127.962-76.638-127.962-58.022v134.66z" fill="currentColor" fillOpacity="0.45"/>
    <path d="M0 219.341l127.961 76.638V161.319L0 219.341z" fill="currentColor" fillOpacity="0.45"/>
  </svg>
)

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/tx', icon: Activity },
  { name: 'EVM', href: '/evm/contracts', icon: EthereumIcon },
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
