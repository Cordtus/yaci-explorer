import { Link, useLocation } from 'react-router'
import { Blocks, Activity, Home, BarChart3 } from 'lucide-react'
import { SearchBar } from '@/components/common/search-bar'
import { css, cx } from '../../../styled-system/css'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Blocks', href: '/blocks', icon: Blocks },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Header() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <Link to="/" className={styles.brand}>
              <div className={styles.brandMark} />
              <span className={styles.brandText}>Yaci Explorer</span>
            </Link>

            <nav className={styles.nav}>
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cx(
                      styles.navItem,
                      pathname === item.href ? styles.navItemActive : styles.navItemInactive
                    )}
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
    bg: 'bg.default',
    backdropFilter: 'blur(8px)',
  }),
  container: css({
    maxW: '6xl',
    mx: 'auto',
    px: '4',
  }),
  bar: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    h: '16',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
  }),
  brandMark: css({
    h: '8',
    w: '8',
    rounded: 'full',
    bg: 'colorPalette.default',
  }),
  brandText: css({
    fontSize: 'xl',
    fontWeight: 'bold',
    letterSpacing: '-0.01em',
  }),
  nav: css({
    display: { base: 'none', md: 'flex' },
    alignItems: 'center',
    gap: '6',
    fontSize: 'sm',
    fontWeight: 'medium',
  }),
  navItem: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    transition: 'color 0.2s ease',
  }),
  navItemActive: css({ color: 'fg.default' }),
  navItemInactive: css({ color: 'fg.muted', _hover: { color: 'fg.default' } }),
  navIcon: css({ h: '4', w: '4' }),
}
