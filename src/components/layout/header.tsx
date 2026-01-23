import { Activity, BarChart3, Blocks, Home, Vote } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { SearchBar } from '@/components/common/search-bar'
import { getBrandingConfig } from '@/config/branding'
import type { ChainFeatures } from '@/config/chains'
import { useChain } from '@/contexts/ChainContext'
import { css, cx } from '@/styled-system/css'
import { EthereumIcon, IBCIcon } from '@/components/icons/icons'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresFeature?: keyof ChainFeatures
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/tx', icon: Activity },
  { name: 'EVM', href: '/evm/contracts', icon: EthereumIcon, requiresFeature: 'evm' },
  { name: 'IBC', href: '/ibc', icon: IBCIcon, requiresFeature: 'ibc' },
  { name: 'Governance', href: '/governance', icon: Vote },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Header() {
  const location = useLocation()
  const pathname = location.pathname
  const branding = getBrandingConfig()
  const { hasFeature } = useChain()

  const visibleNavigation = navigation.filter(item => {
    if (!item.requiresFeature) return true
    return hasFeature(item.requiresFeature)
  })

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <Link to="/" className={styles.brand}>
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.appName} className={styles.logo} />
              ) : (
                <Blocks className={styles.logo} />
              )}
              <span className={styles.brandNameFull}>{branding.appName}</span>
              <span className={styles.brandNameShort}>{branding.appNameShort}</span>
            </Link>

            <nav className={styles.nav}>
              {visibleNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href.startsWith('/evm') && pathname.startsWith('/evm')) ||
                  (item.href.startsWith('/governance') && pathname.startsWith('/governance')) ||
                  (item.href.startsWith('/ibc') && pathname.startsWith('/ibc'))
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
          </div>
        </div>
      </div>
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
    w: 'full',
    maxW: '7xl',
    mx: 'auto',
    px: { base: '4', md: '6' },
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
